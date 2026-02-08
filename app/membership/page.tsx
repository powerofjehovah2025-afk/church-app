"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NewcomerInsert } from "@/types/database.types";
import { loadFormConfig } from "@/lib/forms/form-loader";
import { DynamicForm } from "@/components/forms/dynamic-form";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";

export default function MembershipPage() {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [staticContent, setStaticContent] = useState<FormStaticContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      const config = await loadFormConfig("membership");
      if (config) {
        setFormConfig(config.formConfig);
        setFormFields(config.formFields);
        setStaticContent(config.staticContent);
      }
      setIsLoading(false);
    };
    loadForm();
  }, []);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const supabase = createClient();
    setIsSubmitting(true);
    setError(null);

    try {
      const first_name = (formData.first_name as string)?.trim() || "";
      const surname = (formData.surname as string)?.trim() || "";
      const fullName = `${first_name} ${surname}`.trim();
      const email = (formData.email as string)?.trim() || "";

      if (!email || !first_name || !surname) {
        setError("Please fill in all required fields");
        return;
      }

      // Check if record exists
      const { data: existingRecord } = await supabase
        .from("newcomers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      // Build notes
      const notesParts: string[] = [];
      if (formData.country_origin) notesParts.push(`Country of Origin: ${formData.country_origin}`);
      if (formData.transport) notesParts.push(`Transport: ${formData.transport}`);
      if (formData.start_date) notesParts.push(`Start Date: ${formData.start_date}`);
      if (formData.born_again_when_where) notesParts.push(`Born Again: ${formData.born_again_when_where}`);
      if (formData.baptised_when) notesParts.push(`Baptised: ${formData.baptised_when}`);
      if (formData.sector) notesParts.push(`Sector: ${formData.sector}`);
      if (formData.profession) notesParts.push(`Profession: ${formData.profession}`);
      notesParts.push(`Last Membership Form Update: ${new Date().toISOString().split("T")[0]}`);

      const notes = notesParts.length > 0 ? notesParts.join(" | ") : null;

      // Smart status progression
      const joinWorkforce = (formData.join_workforce as boolean) || false;
      let newStatus = "New";
      if (existingRecord?.status) {
        if (existingRecord.status === "Member") {
          newStatus = "Member";
        } else if (joinWorkforce) {
          if (existingRecord.status === "First Timer" || existingRecord.status === "New") {
            newStatus = "Contacted";
          } else if (existingRecord.status === "Contacted") {
            newStatus = "Engaged";
          } else if (existingRecord.status === "Engaged") {
            newStatus = "Member";
          }
        } else {
          newStatus = existingRecord.status;
        }
      }

      const dataToSave: NewcomerInsert = {
        full_name: existingRecord?.full_name || fullName,
        email: email,
        phone: (formData.phone as string)?.trim() || existingRecord?.phone || null,
        gender: (formData.gender as string) || existingRecord?.gender || null,
        birthday_month: formData.birthday_month ? Number(formData.birthday_month) : null,
        birthday_day: formData.birthday_day ? Number(formData.birthday_day) : null,
        marital_status: (formData.status as string) || existingRecord?.marital_status || null,
        wedding_anniversary_month: formData.wedding_month ? Number(formData.wedding_month) : null,
        wedding_anniversary_day: formData.wedding_day ? Number(formData.wedding_day) : null,
        address: (formData.address as string)?.trim() || existingRecord?.address || null,
        postcode: (formData.postcode as string)?.trim() || null,
        country_of_origin: (formData.country_origin as string) || null,
        transport_mode: (formData.transport as string) || null,
        start_date: (formData.start_date as string) || null,
        is_born_again: (formData.born_again as string) || null,
        baptism_status: (formData.baptised as string) === "Yes",
        department_interest: Array.isArray(formData.departments) ? (formData.departments as string[]) : null,
        career_sector: (formData.sector as string) || null,
        profession: (formData.profession as string) || null,
        has_children: (formData.has_children as boolean) || false,
        gdpr_consent: (formData.gdpr_consent as boolean) || false,
        notes: notes,
        status: newStatus,
      };

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from("newcomers")
          // @ts-expect-error - Supabase type inference issue
          .update(dataToSave)
          .eq("email", email);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("newcomers")
          // @ts-expect-error - Supabase type inference issue
          .insert(dataToSave);
        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 10000);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!formConfig || formFields.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground">
            Form configuration not found. Please configure the form in the admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 bg-green-50 text-green-800 border border-green-200 rounded-lg p-4 shadow-lg z-50">
          <p className="font-medium">Form submitted successfully!</p>
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 text-red-800 border border-red-200 rounded-lg p-4 shadow-lg z-50">
          <p className="font-medium">{error}</p>
        </div>
      )}
      <DynamicForm
        formConfig={formConfig}
        formFields={formFields}
        staticContent={staticContent}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </>
  );
}
