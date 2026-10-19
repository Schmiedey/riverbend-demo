// Local preview server with clean URLs (mirrors vercel.json). No /api, so payments run simulated.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".csv": "text/csv" };
const port = Number(process.env.PORT || 4173);

createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  if (p === "/") p = "/index.html";
  if (!extname(p)) p += ".html";
  try {
    const body = await readFile(join(root, p));
    res.writeHead(200, { "Content-Type": types[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}).listen(port, () => console.log("Preview on http://localhost:" + port));
