import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

/**
 * Next.js Middleware
 * This is the entry point for all middleware logic.
 * Handles session management and route protection.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (webpack hot module replacement)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp, .ico
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};


