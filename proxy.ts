import { NextResponse, type NextRequest } from "next/server";

function getRoleDashboardPath(role: string): string {
  if (role === "super_admin") {
    return "/super-admin/dashboard";
  }
  return `/${role}/dashboard`;
}

function parseTokenPayload(token?: string): { userId: string; role: string } | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed || typeof parsed !== "object" || !parsed.role || !parsed.userId) {
      return null;
    }
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return null;
    }
    return { userId: parsed.userId, role: parsed.role };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Authoritative Express JWT session check
  const authToken = request.cookies.get("auth_token")?.value;
  const tokenPayload = parseTokenPayload(authToken);
  const authenticatedRole = tokenPayload?.role || null;

  const isProtectedRoute =
    pathname.startsWith("/student") ||
    pathname.startsWith("/faculty") ||
    pathname.startsWith("/institution") ||
    pathname.startsWith("/industry") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/protected");

  // 2. If already authenticated via authoritative Express JWT, redirect away from /auth/login or /auth/sign-up to role dashboard
  if (authenticatedRole && (pathname === "/auth/login" || pathname === "/auth/sign-up")) {
    const url = request.nextUrl.clone();
    url.pathname = getRoleDashboardPath(authenticatedRole);
    return NextResponse.redirect(url);
  }

  // 3. Central dispatcher /dashboard
  if (pathname === "/dashboard") {
    const url = request.nextUrl.clone();
    if (authenticatedRole) {
      url.pathname = getRoleDashboardPath(authenticatedRole);
      return NextResponse.redirect(url);
    } else {
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  }

  // 4. Protected Route Enforcement
  if (isProtectedRoute) {
    if (!authenticatedRole) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Role-based routing guard
    if (pathname.startsWith("/student") && authenticatedRole !== "student") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboardPath(authenticatedRole);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/faculty") && authenticatedRole !== "faculty") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboardPath(authenticatedRole);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/institution") && authenticatedRole !== "institution") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboardPath(authenticatedRole);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/industry") && authenticatedRole !== "industry") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboardPath(authenticatedRole);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/super-admin") && authenticatedRole !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboardPath(authenticatedRole);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({
    request,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
