import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const admin = createAdminClient();

    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, full_name, skills")
      .eq("id", memberId)
      .single();

    if (error) {
      console.error("Error fetching member skills:", error);
      return NextResponse.json(
        { error: "Failed to fetch member skills" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      memberId: profile.id,
      memberName: profile.full_name,
      skills: profile.skills || [],
    });
  } catch (error) {
    console.error("Error in GET /api/admin/members/[memberId]/skills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const admin = createAdminClient();
    const body = await request.json();

    const { skills } = body;

    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { error: "Skills must be an array" },
        { status: 400 }
      );
    }

    // Validate all skills are strings
    if (!skills.every((skill) => typeof skill === "string")) {
      return NextResponse.json(
        { error: "All skills must be strings" },
        { status: 400 }
      );
    }

    const { data: updatedProfile, error } = await admin
      .from("profiles")
      .update({ skills })
      .eq("id", memberId)
      .select("id, full_name, skills")
      .single();

    if (error) {
      console.error("Error updating member skills:", error);
      return NextResponse.json(
        { error: "Failed to update member skills" },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      memberId: updatedProfile.id,
      memberName: updatedProfile.full_name,
      skills: updatedProfile.skills || [],
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/members/[memberId]/skills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

