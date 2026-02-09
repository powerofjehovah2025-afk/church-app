import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    const admin = createAdminClient();
    const body = await request.json();

    const { is_read } = body;

    const updateData: Record<string, unknown> = {};
    if (is_read !== undefined) {
      updateData.is_read = is_read;
      if (is_read) {
        updateData.read_at = new Date().toISOString();
      } else {
        updateData.read_at = null;
      }
    }

    const { data: notification, error } = await admin
      .from("notifications")
      .update(updateData)
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating notification:", error);
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error in PUT /api/admin/notifications/[notificationId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    const admin = createAdminClient();

    const { error } = await admin
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      return NextResponse.json(
        { error: "Failed to delete notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/notifications/[notificationId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

