import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormConfigUpdate } from "@/types/database.types";

/**
 * POST: Publish a specific version (set as published, archive others)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params;
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
    const { version_id } = body;

    if (!version_id) {
      return NextResponse.json(
        { error: "Version ID is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    
    // Verify the version exists and belongs to this form type
    const { data: version } = await admin
      .from("form_configs")
      .select("*")
      .eq("id", version_id)
      .eq("form_type", formType)
      .single();

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Archive all other published versions of this form type
    const { error: archiveError } = await admin
      .from("form_configs")
      .update({ status: "archived" } as FormConfigUpdate)
      .eq("form_type", formType)
      .eq("status", "published");

    if (archiveError) {
      console.error("Error archiving old versions:", archiveError);
      return NextResponse.json(
        { error: archiveError.message },
        { status: 500 }
      );
    }

    // Publish the selected version
    const { data: publishedVersion, error: publishError } = await admin
      .from("form_configs")
      .update({ status: "published", is_active: true } as FormConfigUpdate)
      .eq("id", version_id)
      .select()
      .single();

    if (publishError) {
      console.error("Error publishing version:", publishError);
      return NextResponse.json(
        { error: publishError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      version: publishedVersion,
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

