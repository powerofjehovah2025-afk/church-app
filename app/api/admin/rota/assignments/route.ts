import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceAssignmentInsert } from "@/types/database.types";

/**
 * GET: List service assignments.
 * Query params: service_id (single), OR start_date + end_date (YYYY-MM-DD), optional template_id.
 * Returns assignments with service, duty_type, member. Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile && "role" in profile ? (profile as { role: string | null }).role : null;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const templateId = searchParams.get("template_id");

    const admin = createAdminClient();

    let serviceIds: string[] = [];

    if (serviceId) {
      serviceIds = [serviceId];
    } else if (startDate && endDate) {
      let query = admin
        .from("services")
        .select("id")
        .gte("date", startDate)
        .lte("date", endDate);

      if (templateId) {
        const { data: template } = await admin
          .from("service_templates")
          .select("name")
          .eq("id", templateId)
          .single();
        if (template?.name) {
          query = query.eq("name", template.name);
        }
      }

      const { data: services, error: svcError } = await query.order("date", { ascending: true });
      if (svcError) {
        console.error("Error fetching services:", svcError);
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
      }
      serviceIds = (services || []).map((s) => s.id);
    } else {
      return NextResponse.json(
        { error: "Provide service_id or both start_date and end_date" },
        { status: 400 }
      );
    }

    if (serviceIds.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    const { data: assignments, error } = await admin
      .from("service_assignments")
      .select(`
        id,
        service_id,
        duty_type_id,
        member_id,
        status,
        assigned_at,
        notes,
        service:services(id, date, name, time),
        duty_type:duty_types(id, name),
        member:profiles!service_assignments_member_id_fkey(id, full_name, email)
      `)
      .in("service_id", serviceIds)
      .order("service_id")
      .order("duty_type_id");

    if (error) {
      console.error("Error fetching assignments:", error);
      return NextResponse.json(
        { error: "Failed to fetch assignments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments: assignments || [] });
  } catch (err) {
    console.error("GET /api/admin/rota/assignments:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a service assignment (assign a member to a service + duty).
 * Body: { service_id, duty_type_id, member_id, notes?, template_id? }.
 * template_id optional: if provided, validates duty_type belongs to template and service name matches template.
 * Admin only.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile && "role" in profile ? (profile as { role: string | null }).role : null;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      service_id,
      duty_type_id,
      member_id,
      notes,
      template_id,
    } = body as {
      service_id?: string;
      duty_type_id?: string;
      member_id?: string;
      notes?: string | null;
      template_id?: string;
    };

    if (!service_id || typeof service_id !== "string") {
      return NextResponse.json({ error: "service_id is required" }, { status: 400 });
    }
    if (!duty_type_id || typeof duty_type_id !== "string") {
      return NextResponse.json({ error: "duty_type_id is required" }, { status: 400 });
    }
    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json({ error: "member_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: service, error: serviceError } = await admin
      .from("services")
      .select("id, name")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const { data: dutyType } = await admin
      .from("duty_types")
      .select("id")
      .eq("id", duty_type_id)
      .single();

    if (!dutyType) {
      return NextResponse.json({ error: "Duty type not found" }, { status: 404 });
    }

    if (template_id) {
      const { data: template } = await admin
        .from("service_templates")
        .select("name")
        .eq("id", template_id)
        .single();
      if (template && template.name !== service.name) {
        return NextResponse.json(
          { error: "Service does not match the selected template" },
          { status: 400 }
        );
      }
      const { data: link } = await admin
        .from("service_template_duty_types")
        .select("duty_type_id")
        .eq("template_id", template_id)
        .eq("duty_type_id", duty_type_id)
        .maybeSingle();
      if (template_id && !link) {
        return NextResponse.json(
          { error: "Duty type is not part of this template" },
          { status: 400 }
        );
      }
    }

    const { data: member } = await admin
      .from("profiles")
      .select("id")
      .eq("id", member_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { data: existing } = await admin
      .from("service_assignments")
      .select("id")
      .eq("service_id", service_id)
      .eq("duty_type_id", duty_type_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This service slot is already assigned. Update or remove the existing assignment first." },
        { status: 400 }
      );
    }

    const insert: ServiceAssignmentInsert = {
      service_id,
      duty_type_id,
      member_id,
      status: "scheduled",
      assigned_by: user.id,
      notes: notes ?? null,
    };

    const { data: created, error: insertError } = await admin
      .from("service_assignments")
      .insert(insert)
      .select(`
        id,
        service_id,
        duty_type_id,
        member_id,
        status,
        assigned_at,
        notes,
        service:services(id, date, name, time),
        duty_type:duty_types(id, name),
        member:profiles!service_assignments_member_id_fkey(id, full_name, email)
      `)
      .single();

    if (insertError) {
      console.error("Error creating assignment:", insertError);
      return NextResponse.json(
        { error: "Failed to create assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment: created });
  } catch (err) {
    console.error("POST /api/admin/rota/assignments:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
