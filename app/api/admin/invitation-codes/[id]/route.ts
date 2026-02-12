import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const role = profile && "role" in profile ? (profile as { role: string | null }).role : null;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Code ID required" }, { status: 400 });
    }

    const body = await request.json();
    const isActive = typeof body?.is_active === "boolean" ? body.is_active : undefined;
    if (isActive === undefined) {
      return NextResponse.json(
        { error: "is_active (boolean) is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from("invitation_codes")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("id, code, is_active")
      .single();

    if (error) {
      console.error("Error updating invitation code:", error);
      return NextResponse.json(
        { error: "Failed to update invitation code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ code: updated });
  } catch (err) {
    console.error("PATCH /api/admin/invitation-codes/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
