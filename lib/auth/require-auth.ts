import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AuthUser {
  user: { id: string; email?: string | null };
  profile: { role: string | null } | null;
  role: string | null;
}

/**
 * Get the current authenticated user and their profile role.
 * Uses server Supabase client (cookies). Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role =
    profile && "role" in profile ? (profile as { role: string | null }).role : null;
  return { user, profile, role };
}

/**
 * Require an authenticated user with admin role.
 * Returns { user, profile } for use in the route, or a NextResponse (401/403) to return.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email?: string | null }; profile: { role: string | null } | null }
  | NextResponse
> {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }
  return { user: auth.user, profile: auth.profile };
}

export interface RequireMemberOrAdminOptions {
  request: NextRequest;
  /** Query param that must equal user.id for non-admin (e.g. "assigned_to", "recipient_id", "user_id") */
  allowedParam: string;
  /** If true, the param is required for members (must be present and match). Default true. */
  paramRequiredForMember?: boolean;
}

/**
 * Require either admin or an authenticated member accessing their own data.
 * For members, the request must include a query param (e.g. assigned_to) equal to the user's id.
 * Returns { user, profile, role } for use in the route, or a NextResponse (401/403) to return.
 */
export async function requireAuthMemberOrAdmin(
  options: RequireMemberOrAdminOptions
): Promise<
  | AuthUser
  | NextResponse
> {
  const { request, allowedParam, paramRequiredForMember = true } = options;
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.role === "admin") {
    return auth;
  }
  const searchParams = new URL(request.url).searchParams;
  const paramValue = searchParams.get(allowedParam);
  if (paramRequiredForMember && !paramValue) {
    return NextResponse.json(
      { error: `Query parameter "${allowedParam}" is required for members` },
      { status: 400 }
    );
  }
  if (paramValue !== auth.user.id) {
    return NextResponse.json(
      { error: "Forbidden. You may only access your own data." },
      { status: 403 }
    );
  }
  return auth;
}
