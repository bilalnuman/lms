import { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload, createRemoteJWKSet } from "jose";
const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE??""
const AUTH_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET
const AUTH_JWKS_URL = process.env.AUTH_JWKS_URL;

export type SessionUser = {
  id: string;
  roles: string[];
  permissions: string[];
  raw: JWTPayload;
};

function normalizeList(v: unknown): string[] {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.filter(Boolean).map((x) => String(x).toLowerCase());
}

function readTokenFromCookie(req: NextRequest): string | null {
  const raw = req.cookies.get(AUTH_COOKIE)?.value;
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw.slice(7) : raw;
}

async function verifyToken(token: string) {
  if (AUTH_JWKS_URL) {
    const JWKS = createRemoteJWKSet(new URL(AUTH_JWKS_URL));
    return jwtVerify(token, JWKS, { algorithms: ["RS256"] });
  }
  const key = new TextEncoder().encode(AUTH_SECRET);
  return jwtVerify(token, key, { algorithms: ["HS256"] });
}

export async function getUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = readTokenFromCookie(req);
  if (!token) return null;

  try {
    const { payload } = await verifyToken(token);
    const claims: any = (payload as any).payload ?? (payload as any).data ?? payload;

    const id =
      (claims.sub as string | undefined) ||
      (claims.id as string | undefined) ||
      (claims.userId as string | undefined);

    if (!id) return null;

    const roles = normalizeList(claims.roles ?? claims.role);
    const permissions = normalizeList(claims.permissions);

    return { id, roles, permissions, raw: payload };
  } catch {
    console.log("sfdghjkgfdsadfghjgfdsfgh")
    return null;
  }
}
