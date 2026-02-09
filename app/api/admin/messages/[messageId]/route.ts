import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const admin = createAdminClient();

    const { data: message, error } = await admin
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
      `)
      .eq("id", messageId)
      .single();

    if (error || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error in GET /api/admin/messages/[messageId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
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

    const { data: message, error } = await admin
      .from("messages")
      .update(updateData)
      .eq("id", messageId)
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error updating message:", error);
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error in PUT /api/admin/messages/[messageId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const admin = createAdminClient();

    const { error } = await admin.from("messages").delete().eq("id", messageId);

    if (error) {
      console.error("Error deleting message:", error);
      return NextResponse.json(
        { error: "Failed to delete message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/messages/[messageId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

