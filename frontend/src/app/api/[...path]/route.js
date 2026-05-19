import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.API_URL || "http://localhost:4000";

function buildBackendUrl(pathSegments = [], search = "") {
  const base = BACKEND_API_URL.replace(/\/$/, "");
  const path = pathSegments.map(encodeURIComponent).join("/");
  return `${base}/${path}${search || ""}`;
}

function copyRequestHeaders(req) {
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");
  return headers;
}

function rewriteLocationHeader(location, req) {
  if (!location) return location;
  const backendBase = BACKEND_API_URL.replace(/\/$/, "");
  const origin = new URL(req.url).origin;
  return location.startsWith(backendBase) ? location.replace(backendBase, `${origin}/api`) : location;
}

async function proxy(req, context) {
  const params = await context.params;
  const targetUrl = buildBackendUrl(params?.path || [], new URL(req.url).search);
  const method = req.method.toUpperCase();

  const init = {
    method,
    headers: copyRequestHeaders(req),
    redirect: "manual",
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(method)) {
    init.body = await req.arrayBuffer();
  }

  const backendRes = await fetch(targetUrl, init);
  const headers = new Headers(backendRes.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");

  const rewrittenLocation = rewriteLocationHeader(headers.get("location"), req);
  if (rewrittenLocation) headers.set("location", rewrittenLocation);

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers,
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
