import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "./lib/auth";
import {
    isPublicRoute,
    isAuthRoute,
    isProtectedRoute,
    matchGuardForPath,
    checkAccess,
    LOGIN_ROUTE,
    DEFAULT_AFTER_LOGIN_ROUTE,
} from "@/lib/access-control";


export async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const pathname = url.pathname;
    const isApi = pathname.startsWith("/api/");


    // 1) Allow truly public routes
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // 2) Extract user (from signed JWT cookie)
    const user = await getUserFromRequest(req);
    // 3) Prevent logged-in users from visiting auth-only pages
    if (user && isAuthRoute(pathname)) {
        const destination = DEFAULT_AFTER_LOGIN_ROUTE;
        return NextResponse.redirect(new URL(destination, url));
    }


    // 4) Protect all non-public routes
    if (isProtectedRoute(pathname)) {
        if (!user) {
            if (isApi) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            const login = new URL(LOGIN_ROUTE, url);
            login.searchParams.set("next", url.pathname + url.search);
            return NextResponse.redirect(login);
        }


        // 5) Enforce RBAC / permissions per route
        const guard = matchGuardForPath(pathname);
        if (guard) {
            const ok = checkAccess(user, guard);
            if (!ok) {
                if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                return NextResponse.redirect(new URL("/403", url));
            }
        }
    }


    return NextResponse.next();
}


// Run middleware for everything except static assets and Next internals
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|woff|woff2|ttf)).*)",
    ],
};