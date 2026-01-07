import { createServerClient, CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import type { Database } from "@/types/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Define public routes that don't require authentication (forms)
  const publicRoutes = [
    "/",
    "/welcome",
    "/membership",
    "/newcomer",
  ];

  // Define auth routes (login/signup pages and OAuth callbacks)
  const authRoutes = [
    "/login",
    "/signup",
    "/auth/login",
    "/auth/sign-up",
    "/auth/sign-up-success",
    "/auth/forgot-password",
    "/auth/update-password",
    "/auth/confirm",
    "/auth/callback",
    "/auth/error",
  ];

  // Check if the current path is a public route or auth route
  const currentPath = request.nextUrl.pathname;
  
  // Always allow /auth/callback - it's needed for OAuth flow (bypasses all checks)
  if (currentPath === "/auth/callback") {
    return supabaseResponse;
  }
  
  const isPublicRoute = publicRoutes.includes(currentPath);
  const isAuthRoute = authRoutes.includes(currentPath) ||
    currentPath.startsWith("/auth/") ||
    currentPath === "/login" ||
    currentPath === "/signup";

  // If user is not authenticated
  if (!user) {
    // Allow access to public routes and auth routes only
    if (isPublicRoute || isAuthRoute) {
      return supabaseResponse;
    }
    // Redirect all other routes to login
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // User is authenticated - fetch their role from profiles table
  let userRole: string | null = null;
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.sub)
      .maybeSingle();

    if (!profileError && profile) {
      userRole = (profile as { role: string | null }).role;
    }
  } catch (error) {
    // If we can't fetch the role, continue with null
    console.error("Error fetching user role:", error);
  }

  // Allow authenticated users to access auth pages (they might want to log out or create another account)
  // We'll let the pages themselves handle showing appropriate UI if needed
  // No automatic redirect - let users access login/signup pages even when authenticated

  // Protect admin routes - only admins can access
  if (currentPath.startsWith("/admin")) {
    if (userRole !== "admin") {
      // Not an admin, redirect to member dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Protect member routes - members and admins can access
  // (admins can access member dashboard too)
  if (currentPath.startsWith("/dashboard") || currentPath.startsWith("/rota") || 
      currentPath.startsWith("/protected")) {
    // Both members and admins can access these routes
    // No additional check needed
  }

  // Allow access to public routes even when authenticated
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
