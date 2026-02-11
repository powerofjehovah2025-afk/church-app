import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceInsert } from "@/types/database.types";

/**
 * GET: Get current user's attendance records
 * POST: Self-check-in for current user
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

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("attendance")
      .select(`
        *,
        service:services(id, name, date, time)
      `)
      .eq("member_id", user.id)
      .order("created_at", { ascending: false });

    if (serviceId) {
      query = query.eq("service_id", serviceId);
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
 * POST: Self-check-in (member only)
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

    const body = await request.json().catch(() => ({}));
    const { service_id, notes } = body;

    if (!service_id || typeof service_id !== "string") {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const { data: newAttendance, error } = await supabase
      .from("attendance")
      .insert({
        service_id: service_id.trim(),
        member_id: user.id,
        status: "present",
        checked_in_at: new Date().toISOString(),
        notes: notes?.trim() || null,
      } as AttendanceInsert)
      .select(`
        *,
        service:services(id, name, date, time)
      `)
      .single();

    if (error) {
      console.error("Error recording attendance:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already checked in for this service" },
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

