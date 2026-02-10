import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const targetAudience = searchParams.get("target_audience");
    const includeExpired = searchParams.get("include_expired") === "true";

    let query = admin
      .from("announcements")
      .select(`
        *,
        creator:profiles!announcements_created_by_fkey(id, full_name, email)
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (targetAudience) {
      query = query.eq("target_audience", targetAudience);
    }

    if (!includeExpired) {
      const now = new Date().toISOString();
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
    }

    const { data: announcements, error } = await query;

    if (error) {
      console.error("Error fetching announcements:", error);
      return NextResponse.json(
        { error: "Failed to fetch announcements" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements: announcements || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/announcements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const body = await request.json();

    const { title, content, target_audience, is_pinned, expires_at } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await admin.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user has permission (admin, pastor, elder, deacon, leader)
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "pastor", "elder", "deacon", "leader"].includes(profile.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { data: announcement, error } = await admin
      .from("announcements")
      .insert({
        title,
        content,
        created_by: user.id,
        target_audience: target_audience || "all",
        is_pinned: is_pinned || false,
        expires_at: expires_at || null,
      })
      .select(`
        *,
        creator:profiles!announcements_created_by_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error creating announcement:", error);
      return NextResponse.json(
        { error: "Failed to create announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/announcements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

