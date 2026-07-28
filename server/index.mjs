import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { createGoogleCalendarGateway } from "./googleCalendarGateway.mjs";

try {
  loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const port = Number(process.env.PORT ?? 4173);
const appOrigin = process.env.ATLASTIME_APP_ORIGIN ?? `http://localhost:${port}`;
const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const required = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI", "GOOGLE_TOKEN_ENCRYPTION_KEY"];
const missing = required.filter((name) => !process.env[name]);
const gateway = missing.length ? null : createGoogleCalendarGateway({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
  appOrigin,
  encryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
});

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

async function requestFromNode(request) {
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : Buffer.concat(await Array.fromAsync(request));
  return new Request(new URL(request.url ?? "/", appOrigin), {
    method: request.method,
    headers: request.headers,
    body,
  });
}

async function writeResponse(response, nodeResponse) {
  nodeResponse.setHeader("x-content-type-options", "nosniff");
  nodeResponse.setHeader("x-frame-options", "DENY");
  nodeResponse.setHeader("referrer-policy", "strict-origin-when-cross-origin");
  for (const [name, value] of response.headers) {
    if (name !== "set-cookie") nodeResponse.setHeader(name, value);
  }
  const setCookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : []);
  if (setCookies.length) nodeResponse.setHeader("set-cookie", setCookies);
  nodeResponse.statusCode = response.status;
  nodeResponse.end(Buffer.from(await response.arrayBuffer()));
}

async function serveStatic(pathname, response) {
  const decoded = decodeURIComponent(pathname);
  const requested = resolve(dist, `.${decoded}`);
  let file = requested === dist || requested.startsWith(`${dist}${sep}`) ? requested : join(dist, "index.html");
  if (file === dist) file = join(dist, "index.html");
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    file = join(dist, "index.html");
  }
  const body = await readFile(file);
  response.writeHead(200, {
    "content-type": contentTypes[extname(file)] ?? "application/octet-stream",
    "cache-control": file.endsWith("index.html") || file.endsWith("sw.js") || file.endsWith("manifest.webmanifest")
      ? "no-cache"
      : "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
  });
  response.end(body);
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", appOrigin);
    if (url.pathname.startsWith("/api/google-calendar/")) {
      if (!gateway) {
        return writeResponse(new Response(JSON.stringify({ error: "calendar_gateway_not_configured", missing }), {
          status: 503,
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        }), response);
      }
      return writeResponse(await gateway(await requestFromNode(request)), response);
    }
    return serveStatic(url.pathname, response);
  } catch {
    response.writeHead(500, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify({ error: "internal_server_error" }));
  }
}).listen(port, () => {
  console.log(`AtlasTime listening on ${appOrigin}`);
  if (missing.length) console.log(`Google Calendar connection disabled; missing ${missing.join(", ")}`);
});
