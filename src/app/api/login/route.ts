import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { z } from "zod";

const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE || "session";
const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

const bodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

/** POST /api/login — verifies credentials, issues JWT, sets cookie */
export async function POST(req: NextRequest) {
    // Basic CSRF protection: only allow same-origin POSTs
    const origin = req.headers.get("origin");
    const host = new URL(req.url).origin;
    if (origin && origin !== host) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    let data: z.infer<typeof bodySchema>;
    try {
        data = bodySchema.parse(await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const user = await verifyUser(data.email, data.password);
    if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await new SignJWT({
        sub: user.id,
        roles: user.roles,
        permissions: user.permissions ?? [],
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(AUTH_SECRET);
    // @ts-ignore
    cookies().set({
        name: AUTH_COOKIE,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // allow localhost over http
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({ ok: true });
}

// TODO: replace with real DB lookup + bcrypt check
async function verifyUser(email: string, password: string) {
    if (email === "demo@lms.test" && password === "demo1234") {
        return { id: "u_demo", roles: ["faculty"] as string[], permissions: [] as string[] };
    }
    return null;
}
