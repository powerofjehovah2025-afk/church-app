"use client";

import { useState, useEffect } from "react";
import type { NewcomerInsert } from "@/types/database.types";
import { loadFormConfig } from "@/lib/forms/form-loader";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { submitFormData } from "@/lib/forms/form-submission-handler";
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
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitFormData("welcome", formData);

      if (!result.success) {
        setError(result.error || "Failed to submit form");
        return;
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
