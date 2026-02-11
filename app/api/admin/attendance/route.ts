import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AttendanceInsert } from "@/types/database.types";

/**
 * GET: List attendance records (admin only)
 * Query params: service_id, member_id, start_date, end_date
 * POST: Record attendance (admin only)
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

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service_id");
    const memberId = searchParams.get("member_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = admin
      .from("attendance")
      .select(`
        *,
        service:services(id, name, date),
        member:profiles!attendance_member_id_fkey(id, full_name, email),
        recorder:profiles!attendance_recorded_by_fkey(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (serviceId) {
      query = query.eq("service_id", serviceId);
    }

    if (memberId) {
      query = query.eq("member_id", memberId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: attendance, error } = await query;

    if (error) {
      console.error("Error fetching attendance:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ attendance: attendance || [] });
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
 * POST: Record attendance (admin only)
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
    const { service_id, member_id, status, notes } = body;

    if (!service_id || typeof service_id !== "string") {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    if (status && !["present", "absent", "late", "excused"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: newAttendance, error } = await admin
      .from("attendance")
      .insert({
        service_id: service_id.trim(),
        member_id: member_id.trim(),
        status: status || "present",
        notes: notes?.trim() || null,
        recorded_by: user.id,
      } as AttendanceInsert)
      .select(`
        *,
        service:services(id, name, date),
        member:profiles!attendance_member_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error recording attendance:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Attendance already recorded for this member and service" },
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
      attendance: newAttendance,
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

