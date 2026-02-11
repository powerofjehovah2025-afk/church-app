import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TeamMemberInsert } from "@/types/database.types";

/**
 * GET: Get team members
 * POST: Add member to team (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { teamId } = await params;
    const isAdmin = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()).data?.role === "admin";

    const client = isAdmin ? createAdminClient() : supabase;

    const { data: members, error } = await client
      .from("team_members")
      .select(`
        *,
        member:profiles!team_members_member_id_fkey(id, full_name, email, role)
      `)
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching team members:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Add member to team (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { teamId } = await params;
    const body = await request.json().catch(() => ({}));
    const { member_id, role } = body;

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: newMember, error } = await admin
      .from("team_members")
      .insert({
        team_id: teamId,
        member_id: member_id.trim(),
        role: role || "member",
      } as TeamMemberInsert)
      .select(`
        *,
        member:profiles!team_members_member_id_fkey(id, full_name, email, role)
      `)
      .single();

    if (error) {
      console.error("Error adding team member:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Member is already in this team" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: newMember,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove member from team (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("member_id");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("member_id", memberId);

    if (error) {
      console.error("Error removing team member:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member removed from team successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

