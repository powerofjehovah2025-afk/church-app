"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NewcomerInsert } from "@/types/database.types";
import { loadFormConfig } from "@/lib/forms/form-loader";
import { DynamicForm } from "@/components/forms/dynamic-form";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";

export default function NewcomerPage() {
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
      const config = await loadFormConfig("newcomer");
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
      const full_name = (formData.full_name as string)?.trim() || "";
      const email = (formData.email as string)?.trim() || "";

      if (!email || !full_name) {
        setError("Please fill in all required fields");
        return;
      }

      const insertData: NewcomerInsert = {
        full_name: full_name,
        email: email || null,
        phone: (formData.phone as string)?.trim() || null,
        service_time: (formData.service_time as string) || null,
        age_group: (formData.age_group as string) || null,
        interest_areas: Array.isArray(formData.interest_areas) && (formData.interest_areas as string[]).length > 0
          ? (formData.interest_areas as string[])
          : null,
        how_did_you_hear: (formData.how_did_you_hear as string)?.trim() || null,
        prayer_request: (formData.prayer_request as string)?.trim() || null,
        status: "New",
      };

      const { error: insertError } = await supabase
        .from("newcomers")
        .insert(insertData);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
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
