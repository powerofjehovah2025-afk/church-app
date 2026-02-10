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
      .select("id, full_name, availability")
      .eq("id", memberId)
      .single();

    if (error) {
      console.error("Error fetching member availability:", error);
      return NextResponse.json(
        { error: "Failed to fetch member availability" },
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
      availability: profile.availability || {},
    });
  } catch (error) {
    console.error("Error in GET /api/admin/members/[memberId]/availability:", error);
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

    const { availability } = body;

    if (availability !== null && typeof availability !== "object") {
      return NextResponse.json(
        { error: "Availability must be an object" },
        { status: 400 }
      );
    }

    const { data: updatedProfile, error } = await admin
      .from("profiles")
      .update({ availability: availability || {} })
      .eq("id", memberId)
      .select("id, full_name, availability")
      .single();

    if (error) {
      console.error("Error updating member availability:", error);
      return NextResponse.json(
        { error: "Failed to update member availability" },
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
      availability: updatedProfile.availability || {},
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/members/[memberId]/availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

