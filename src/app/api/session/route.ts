// src/app/api/session/route.ts   <-- or app/api/session/route.ts if no src/
import { NextResponse } from "next/server";

const AUTH_COOKIE = process.env.AUTH_COOKIE || "session";

export async function GET() {
  // Handy to confirm the route exists in the browser
  return NextResponse.json({ ok: true, note: "POST here with { accessToken }" });
}

export async function POST(req: Request) {
  const { accessToken, maxAge } = await req.json().catch(() => ({}));
  if (!accessToken) {
    return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: typeof maxAge === "number" ? maxAge : 60 * 60, // 1h
  });
  return res;
}
