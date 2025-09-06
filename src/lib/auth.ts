import { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";


const AUTH_COOKIE = process.env.AUTH_COOKIE || "session_token";
const AUTH_SECRET = process.env.AUTH_SECRET || "replace-me-dev-secret"; // set in prod


export type SessionUser = {
    id: string;
    roles: string[]; // normalized lower-case role slugs
    permissions: string[]; // expanded list incl. role-derived perms
    raw: JWTPayload; // original claims
};


export async function getUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) return null;


    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(AUTH_SECRET));


        const id = (payload.sub as string) || "";
        if (!id) return null;


        // Normalize roles -> [string]
        const roles = (Array.isArray(payload.roles)
            ? payload.roles
            : (payload as any).role
                ? [(payload as any).role]
                : [])
            .filter(Boolean)
            .map((r) => String(r).toLowerCase());


        const permissions = (Array.isArray((payload as any).permissions)
            ? (payload as any).permissions
            : [])
            .filter(Boolean)
            .map((p: string) => String(p).toLowerCase());


        const user: SessionUser = { id, roles, permissions, raw: payload };
        return user;
    } catch {
        // Invalid/expired token -> anonymous
        return null;
    }
}