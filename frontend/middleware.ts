import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page and the login API route through
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin-login") ||
    pathname.startsWith("/api/admin-logout")
  ) {
    return NextResponse.next();
  }

  // Block all other /admin/* routes unless auth cookie is present
  if (pathname.startsWith("/admin")) {
    const adminAuth = req.cookies.get("adminAuth");
    if (!adminAuth || adminAuth.value !== "1") {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
