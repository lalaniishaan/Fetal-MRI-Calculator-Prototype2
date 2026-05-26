import http from "http";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import { evaluateCase } from "./core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicFolder = join(__dirname, "../public");
const port = Number(process.env.PORT ?? 3001);

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function getContentType(filePath: string): string {
  return mimeTypes[extname(filePath)] ?? "application/octet-stream";
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf-8");
}

async function serveFile(res: http.ServerResponse, filePath: string): Promise<void> {
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(body);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

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
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request" }));
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, () => {
  console.log(`Website running at http://localhost:${port}`);
});
