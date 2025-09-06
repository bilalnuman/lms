import { NextResponse } from "next/server";

const AUTH_COOKIE = process.env.AUTH_COOKIE || "session";

/** POST /api/session { accessToken: string, maxAge?: number } */
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
