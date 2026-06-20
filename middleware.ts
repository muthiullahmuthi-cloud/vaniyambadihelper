import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and its API
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  // Protect all /admin/* and /api/admin/* routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify cookie value matches hashed password
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return new NextResponse("ADMIN_PASSWORD not configured", { status: 500 });
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(adminPassword);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (sessionCookie.value !== expectedHash) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
