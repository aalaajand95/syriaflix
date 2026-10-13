#!/usr/bin/env node
// Serves the static export in ./out — used as the Railway start command.
// Listens on $PORT (set by Railway), defaults to 3000 locally.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve("out");
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".vtt": "text/vtt; charset=utf-8",
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml)|image\/svg)/;

if (!fs.existsSync(ROOT)) {
  console.error("✗ ./out not found — run `npm run build` first");
  process.exit(1);
}

function resolveFile(urlPath) {
  const target = path.join(ROOT, urlPath);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null; // path traversal
  try {
    const stat = fs.statSync(target);
    if (stat.isFile()) return { file: target };
    if (stat.isDirectory()) {
      if (!urlPath.endsWith("/")) return { redirect: `${urlPath}/` };
      const index = path.join(target, "index.html");
      if (fs.existsSync(index)) return { file: index };
    }
  } catch {
    // not found
  }
  return null;
}

function send(req, res, status, file, headers = {}) {
  const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const gzip = COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
  res.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    Vary: "Accept-Encoding",
    ...(gzip ? { "Content-Encoding": "gzip" } : {}),
    ...headers,
  });
  if (req.method === "HEAD") return res.end();
  const stream = fs.createReadStream(file);
  (gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
}

http
  .createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }

    const found = resolveFile(pathname);
    if (found?.redirect) {
      res.writeHead(308, { Location: found.redirect + url.search }).end();
    } else if (found) {
      // Hashed build assets never change; pages must revalidate so new deploys show up.
      const cache = pathname.startsWith("/_next/static/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate";
      send(req, res, 200, found.file, { "Cache-Control": cache });
    } else {
      send(req, res, 404, path.join(ROOT, "404.html"), { "Cache-Control": "no-store" });
    }
  })
  .listen(PORT, "0.0.0.0", () => console.log(`SyriaFlix serving ./out on port ${PORT}`));
