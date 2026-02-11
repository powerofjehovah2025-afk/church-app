import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MinistryTeamInsert } from "@/types/database.types";

/**
 * GET: List all ministry teams
 * POST: Create new ministry team (admin only)
 */
export async function GET(request: NextRequest) {
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

    const isAdmin = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()).data?.role === "admin";

    const client = isAdmin ? createAdminClient() : supabase;

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("is_active");

    let query = client
      .from("ministry_teams")
      .select(`
        *,
        leader:profiles!ministry_teams_leader_id_fkey(id, full_name, email),
        members:team_members(count)
      `)
      .order("name", { ascending: true });

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data: teams, error } = await query;

    if (error) {
      console.error("Error fetching teams:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ teams: teams || [] });
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
 * POST: Create new ministry team (admin only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const { name, description, leader_id, is_active } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: newTeam, error } = await admin
      .from("ministry_teams")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        leader_id: leader_id || null,
        is_active: is_active !== undefined ? is_active : true,
      } as MinistryTeamInsert)
      .select(`
        *,
        leader:profiles!ministry_teams_leader_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error creating team:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      team: newTeam,
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

