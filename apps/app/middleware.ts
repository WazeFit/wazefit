import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check auth token
  const token = request.cookies.get("auth-token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify token
  const decoded = await verifyToken(token.value);

  if (!decoded) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based redirects
  if (pathname.startsWith("/expert") && decoded.user.role !== "expert") {
    return NextResponse.redirect(new URL("/user/treinos", request.url));
  }

  if (pathname.startsWith("/user") && decoded.user.role === "expert") {
    return NextResponse.redirect(new URL("/expert/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
