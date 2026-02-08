"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NewcomerInsert } from "@/types/database.types";
import { loadFormConfig } from "@/lib/forms/form-loader";
import { DynamicForm } from "@/components/forms/dynamic-form";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";

export default function WelcomePage() {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [staticContent, setStaticContent] = useState<FormStaticContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      const config = await loadFormConfig("welcome");
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
      // Extract form data - map dynamic fields to database columns
      const first_name = (formData.first_name as string)?.trim() || "";
      const surname = (formData.surname as string)?.trim() || "";
      const fullName = `${first_name} ${surname}`.trim();
      const email = (formData.email as string)?.trim() || "";

      if (!email || !first_name || !surname) {
        setError("Please fill in all required fields");
        return;
      }

      // Check if record exists by email
      const { data: existingRecord, error: fetchError } = await supabase
        .from("newcomers")
        .select("id, full_name, phone, marital_status, address, notes, status")
        .eq("email", email)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      // Smart notes merging (simplified version)
      const notesParts: string[] = [];
      if (formData.joining_us) notesParts.push(`Joining us: ${formData.joining_us}`);
      if (formData.can_visit) notesParts.push(`Can visit: ${formData.can_visit}`);
      if (formData.whatsapp_group) notesParts.push(`WhatsApp Group: ${formData.whatsapp_group}`);
      if (formData.sex) notesParts.push(`Sex: ${formData.sex}`);
      if (formData.postcode) notesParts.push(`Postcode: ${formData.postcode}`);
      if (formData.whatsapp) notesParts.push(`WhatsApp: ${formData.whatsapp}`);
      notesParts.push(`Last Welcome Form Update: ${new Date().toISOString().split("T")[0]}`);

      const notes = notesParts.length > 0 ? notesParts.join(" | ") : null;

      // Smart status progression
      const joiningUs = (formData.joining_us as string) || "";
      let newStatus = "First Timer";
      if (existingRecord?.status) {
        if (existingRecord.status === "Member") {
          newStatus = "Member";
        } else if (joiningUs === "Yes") {
          if (existingRecord.status === "First Timer" || existingRecord.status === "New") {
            newStatus = "Contacted";
          } else if (existingRecord.status === "Contacted") {
            newStatus = "Engaged";
          }
        } else {
          newStatus = existingRecord.status;
        }
      }

      const dataToSave: NewcomerInsert = {
        full_name: existingRecord?.full_name || fullName,
        email: email,
        phone: (formData.phone as string)?.trim() || existingRecord?.phone || null,
        marital_status: (formData.marital_status as string) || existingRecord?.marital_status || null,
        address: (formData.address as string)?.trim() || existingRecord?.address || null,
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

      setShowWhatsAppButton((formData.whatsapp_group as string) === "Yes");
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowWhatsAppButton(false);
      }, 10000);
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

  // Show message if no config is loaded - admin needs to configure the form

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
          {showWhatsAppButton && (
            <a
              href="https://chat.whatsapp.com/YOUR_GROUP_LINK"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Join WhatsApp Group
            </a>
          )}
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
