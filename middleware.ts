import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Allow access to auth routes and verification page
    if (pathname.startsWith("/auth")) {
      return NextResponse.next();
    }

    // Check email verification for authenticated users
    if (token && !(token as any).emailVerified) {
      // Allow access to API routes for resending verification
      if (pathname === "/api/auth/resend-verification" ||
          pathname === "/api/auth/verify-email") {
        return NextResponse.next();
      }

      // Redirect to need-verification page if trying to access protected routes
      if (pathname.startsWith("/dashboard") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/play") ||
          pathname.startsWith("/spin")) {
        const email = token.email as string;

        // Automatically trigger resend verification email
        if (typeof window === 'undefined') {
          // Server-side - we can't make the API call here
          // The client-side need-verification page will handle it
        }

        return NextResponse.redirect(
          new URL(`/auth/need-verification?email=${encodeURIComponent(email)}`, req.url)
        );
      }
    }

    // Admin route protection
    if (pathname.startsWith("/admin")) {
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