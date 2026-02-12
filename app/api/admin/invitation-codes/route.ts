import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: codes, error } = await admin
      .from("invitation_codes")
      .select("id, code, created_at, created_by, used_at, used_by")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitation codes:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitation codes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ codes: codes || [] });
  } catch (err) {
    console.error("GET /api/admin/invitation-codes:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code || code.length < 4) {
      return NextResponse.json(
        { error: "Code is required and must be at least 4 characters" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: newCode, error } = await admin
      .from("invitation_codes")
      .insert({
        code,
        created_by: user.id,
      })
      .select("id, code, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This invitation code already exists" },
          { status: 400 }
        );
      }
      console.error("Error creating invitation code:", error);
      return NextResponse.json(
        { error: "Failed to create invitation code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ code: newCode });
  } catch (err) {
    console.error("POST /api/admin/invitation-codes:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
