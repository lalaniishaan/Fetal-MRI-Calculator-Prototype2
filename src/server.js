import http from "http";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import { evaluateCase } from "./core.js";
import { TfidfRagEngine } from "./rag.js";
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
function parseQueryRequest(input) {
    const request = input;
    if (typeof request.query !== "string" || request.query.trim() === "") {
        throw new Error("A non-empty query is required.");
    }
    const parsedTopK = typeof request.topK === "number" ? request.topK : 5;
    return {
        query: request.query.trim(),
        topK: Number.isFinite(parsedTopK) ? Math.min(Math.max(Math.round(parsedTopK), 1), 10) : 5
    };
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
                contexts: engine.retrieve(request.query, request.topK),
                retrievalBackend: "local-tfidf"
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
            const answer = await engine.answer(request.query, request.topK);
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
