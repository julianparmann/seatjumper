import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Admin route protection
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const token = req.nextauth.token;
      if (!token || !(token as any).isAdmin) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow all auth routes
        if (req.nextUrl.pathname.startsWith("/auth")) {
          return true;
        }
        // Protected routes require authentication
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token;
        }
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token;
        }
        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/spins/create",
    "/api/orders/:path*",
  ],
};