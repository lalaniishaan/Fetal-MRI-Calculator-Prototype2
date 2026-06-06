import http from "http";
import fs from "fs/promises";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import { evaluateCase } from "./core.js";
import { TfidfRagEngine } from "./rag.js";
try {
    loadEnvFile();
}
catch (error) {
    if (!isMissingEnvFileError(error)) {
        throw error;
    }
}
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicFolder = join(__dirname, "../public");
const workspaceFolder = join(__dirname, "..");
const port = Number(process.env.PORT ?? 3001);
let ragEnginePromise;
const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8"
};
function isMissingEnvFileError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT");
}
function getContentType(filePath) {
    return mimeTypes[extname(filePath)] ?? "application/octet-stream";
}
function getRagEngine() {
    ragEnginePromise ??= TfidfRagEngine.fromWorkspace(workspaceFolder);
    return ragEnginePromise;
}
async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
}
async function serveFile(res, filePath) {
    try {
        const body = await fs.readFile(filePath);
        res.writeHead(200, { "Content-Type": getContentType(filePath) });
        res.end(body);
    }
    catch {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
    }
}
function sendJson(res, statusCode, body) {
    res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
}
const parameterIds = new Set([
    "skull_bpd",
    "skull_ofd",
    "brain_bpd",
    "brain_ofd_left",
    "brain_ofd_right",
    "atrium_left",
    "atrium_right",
    "csp",
    "cc_length",
    "tcd",
    "vermis_cc",
    "vermis_ap",
    "pons_ap",
    "third_ventricle"
]);
function parseQueryRequest(input) {
    const request = input;
    if (typeof request.query !== "string" || request.query.trim() === "") {
        throw new Error("A non-empty query is required.");
    }
    const parsedTopK = typeof request.topK === "number" ? request.topK : 5;
    const parsedRequest = {
        query: request.query.trim(),
        topK: Number.isFinite(parsedTopK) ? Math.min(Math.max(Math.round(parsedTopK), 1), 10) : 5
    };
    const caseContext = parseCaseContext(input.caseContext);
    if (caseContext !== undefined) {
        parsedRequest.caseContext = caseContext;
    }
    return parsedRequest;
}
function parseCaseContext(input) {
    if (input === undefined) {
        return undefined;
    }
    if (!isRecord(input)) {
        throw new Error("caseContext must be an object.");
    }
    const gaWeeks = requireFiniteNumber(input.gaWeeks, "caseContext.gaWeeks");
    const impression = requireString(input.impression, "caseContext.impression", 2000);
    if (!Array.isArray(input.findings) || input.findings.length > 50) {
        throw new Error("caseContext.findings must be an array with at most 50 entries.");
    }
    if (!Array.isArray(input.differentialConsiderations) || input.differentialConsiderations.length > 20) {
        throw new Error("caseContext.differentialConsiderations must be an array with at most 20 entries.");
    }
    return {
        gaWeeks,
        impression,
        findings: input.findings.map(parseCaseFinding),
        differentialConsiderations: input.differentialConsiderations.map((value, index) => requireString(value, `caseContext.differentialConsiderations[${index}]`, 300))
    };
}
function parseCaseFinding(input, index) {
    if (!isRecord(input)) {
        throw new Error(`caseContext.findings[${index}] must be an object.`);
    }
    const parameterId = requireString(input.parameterId, `caseContext.findings[${index}].parameterId`, 50);
    if (!parameterIds.has(parameterId)) {
        throw new Error(`Unknown case-context parameter: ${parameterId}.`);
    }
    if (input.band !== "<5th" && input.band !== "normal" && input.band !== ">95th") {
        throw new Error(`Invalid band for caseContext.findings[${index}].`);
    }
    return {
        parameterId,
        value: requireFiniteNumber(input.value, `caseContext.findings[${index}].value`),
        consensusZ: requireFiniteNumber(input.consensusZ, `caseContext.findings[${index}].consensusZ`),
        percentile: requireFiniteNumber(input.percentile, `caseContext.findings[${index}].percentile`),
        band: input.band
    };
}
function isRecord(input) {
    return typeof input === "object" && input !== null && !Array.isArray(input);
}
function requireFiniteNumber(input, field) {
    if (typeof input !== "number" || !Number.isFinite(input)) {
        throw new Error(`${field} must be a finite number.`);
    }
    return input;
}
function requireString(input, field, maxLength) {
    if (typeof input !== "string" || input.trim() === "" || input.length > maxLength) {
        throw new Error(`${field} must be a non-empty string up to ${maxLength} characters.`);
    }
    return input.trim();
}
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/rag/health") {
        try {
            const engine = await getRagEngine();
            sendJson(res, 200, {
                ...engine.health(),
                geminiEnabled: process.env.GEMINI_API_KEY !== undefined && process.env.GEMINI_API_KEY.trim() !== ""
            });
            return;
        }
        catch (error) {
            sendJson(res, 500, { error: error instanceof Error ? error.message : "RAG health check failed" });
            return;
        }
    }
    if (req.method === "GET") {
        if (url.pathname === "/") {
            await serveFile(res, join(publicFolder, "index.html"));
            return;
        }
        const requestedFile = join(publicFolder, url.pathname);
        if (requestedFile.startsWith(publicFolder)) {
            await serveFile(res, requestedFile);
            return;
        }
    }
    if (req.method === "POST" && url.pathname === "/api/evaluate") {
        try {
            const rawBody = await readBody(req);
            const input = JSON.parse(rawBody);
            const result = evaluateCase(input);
            sendJson(res, 200, result);
            return;
        }
        catch (error) {
            sendJson(res, 400, { error: error instanceof Error ? error.message : "Invalid request" });
            return;
        }
    }
    if (req.method === "POST" && url.pathname === "/api/rag/retrieve") {
        try {
            const rawBody = await readBody(req);
            const request = parseQueryRequest(JSON.parse(rawBody));
            const engine = await getRagEngine();
            sendJson(res, 200, {
                contexts: engine.retrieve(request.query, request.topK, request.caseContext),
                retrievalBackend: "local-tfidf",
                caseContextIncluded: request.caseContext !== undefined
            });
            return;
        }
        catch (error) {
            sendJson(res, 400, { error: error instanceof Error ? error.message : "RAG retrieval failed" });
            return;
        }
    }
    if (req.method === "POST" && url.pathname === "/api/rag/ask") {
        try {
            const rawBody = await readBody(req);
            const request = parseQueryRequest(JSON.parse(rawBody));
            const engine = await getRagEngine();
            const answer = await engine.answer(request.query, request.topK, request.caseContext);
            sendJson(res, 200, answer);
            return;
        }
        catch (error) {
            sendJson(res, 400, { error: error instanceof Error ? error.message : "RAG answer failed" });
            return;
        }
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
});
server.listen(port, () => {
    console.log(`Website running at http://localhost:${port}`);
});
