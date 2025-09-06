import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const AUTH_COOKIE = process.env.AUTH_COOKIE || "session";

export async function POST() {
    // @ts-ignore
    cookies().set({
        name: AUTH_COOKIE,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
    return NextResponse.json({ ok: true });
}
