"use client";

import { useState, useEffect } from "react";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";
import { FormSection } from "./form-section";
import { groupFieldsBySection } from "@/lib/forms/form-loader";
import { validateFormData } from "@/lib/forms/form-validator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DynamicFormProps {
  formConfig: FormConfig;
  formFields: FormField[];
  staticContent: FormStaticContent[];
  onSubmit: (formData: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function DynamicForm({
  formConfig,
  formFields,
  staticContent,
  onSubmit,
  isLoading = false,
  submitButtonText = "Submit",
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, unknown> = {};
    formFields.forEach((field) => {
      if (field.default_value !== null) {
        initialData[field.field_key] = field.default_value;
      } else if (field.field_type === "checkbox") {
        initialData[field.field_key] = [];
      } else {
        initialData[field.field_key] = "";
      }
    });
    setFormData(initialData);
  }, [formFields]);

  const handleFieldChange = (fieldKey: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateFormData(formData, formFields);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      // Handle error - could set a general error message
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group fields by section
  const groupedFields = groupFieldsBySection(formFields);
  const sections = Array.from(groupedFields.entries()).sort((a, b) => {
    // Sort sections - "General" first, then alphabetically
    if (a[0] === "General") return -1;
    if (b[0] === "General") return 1;
    return a[0].localeCompare(b[0]);
  });

  // Get static content
  const getStaticContent = (key: string): string | null => {
    const content = staticContent.find((c) => c.content_key === key);
    return content?.content || null;
  };

  const welcomeMessage = getStaticContent("welcome_message");
  const description = getStaticContent("description") || formConfig.description;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {formConfig.title}
          </h1>
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">
              {description}
            </p>
          )}
          {welcomeMessage && (
            <div
              className="mt-4 text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: welcomeMessage }}
            />
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold">
              {formConfig.title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {sections.map(([sectionName, fields]) => (
                <FormSection
                  key={sectionName}
                  sectionName={sectionName}
                  fields={fields}
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                />
              ))}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting || isLoading ? "Submitting..." : submitButtonText}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

