import { NextResponse } from "next/server";
import {jwtVerify} from 'jose';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) console.log("🧩 Middleware triggered:", pathname);

  // Allow non-protected routes
  if (!isDashboard) return NextResponse.next();

  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (isDev) console.log("🔑 refreshToken:", refreshToken ? "Found" : "Missing");

  // If no token → redirect
  if (!refreshToken) {
    if (isDev) console.log(" No token — redirecting to /auth/login");
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
   const secret= new TextEncoder().encode(process.env.JWT_SECRET);
    // Verify token
    await jwtVerify(refreshToken,secret);
    if (isDev) console.log("Token verified successfully");
    return NextResponse.next();
  } catch (error) {
    if (isDev) console.log("Access token invalid or expired:", error.message);
    // Try refresh
    try {
      if (isDev) console.log(" Trying to refresh token...");

      const refreshResponse = await fetch(`${req.nextUrl.origin}/api/auth/refresh`, {
        method: "POST",
        headers: { cookie: req.headers.get("cookie") || "" },
      });

      if (refreshResponse.ok) {
        if (isDev) console.log("Refresh successful — continuing request");
        return NextResponse.next();
      } else {
        if (isDev) console.log("Refresh failed — redirecting to login");
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    } catch (err) {
      if (isDev) console.log("Refresh error:", err.message);
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
