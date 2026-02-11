import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MinistryTeamUpdate } from "@/types/database.types";

/**
 * GET: Get single team with members
 * PUT: Update team (admin only)
 * DELETE: Soft delete team (admin only)
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

    const { data: team, error: teamError } = await client
      .from("ministry_teams")
      .select(`
        *,
        leader:profiles!ministry_teams_leader_id_fkey(id, full_name, email)
      `)
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get team members
    const { data: members, error: membersError } = await client
      .from("team_members")
      .select(`
        *,
        member:profiles!team_members_member_id_fkey(id, full_name, email, role)
      `)
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching team members:", membersError);
    }

    return NextResponse.json({
      team,
      members: members || [],
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
 * PUT: Update team (admin only)
 */
export async function PUT(
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
    const { name, description, leader_id, is_active } = body;

    const updateData: MinistryTeamUpdate = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (leader_id !== undefined) {
      updateData.leader_id = leader_id || null;
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const admin = createAdminClient();
    const { data: updatedTeam, error } = await admin
      .from("ministry_teams")
      .update(updateData)
      .eq("id", teamId)
      .select(`
        *,
        leader:profiles!ministry_teams_leader_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error updating team:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      team: updatedTeam,
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
 * DELETE: Soft delete team (admin only)
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

    const admin = createAdminClient();
    // Soft delete by setting is_active to false
    const { error } = await admin
      .from("ministry_teams")
      .update({ is_active: false })
      .eq("id", teamId);

    if (error) {
      console.error("Error deleting team:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
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

