"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldMappingPreview } from "./field-mapping-preview";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { Database } from "lucide-react";

interface FormPreviewProps {
  formConfig: FormConfig;
  formFields: FormField[];
  staticContent: FormStaticContent[];
}

export function FormPreview({
  formConfig,
  formFields,
  staticContent,
}: FormPreviewProps) {
  const handleSubmit = async (formData: Record<string, unknown>) => {
    // Preview mode - just log the data
    console.log("Form submission preview:", formData);
    alert("This is a preview. Form data would be submitted in the actual form.");
  };

  return (
    <Tabs defaultValue="preview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="preview">Form Preview</TabsTrigger>
        <TabsTrigger value="mapping">
          <Database className="h-4 w-4 mr-2" />
          Field Mappings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="preview">
        <Card>
          <CardHeader>
            <CardTitle>Form Preview</CardTitle>
            <CardDescription>
              Preview how the form will appear to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/20">
              <DynamicForm
                formConfig={formConfig}
                formFields={formFields}
                staticContent={staticContent}
                onSubmit={handleSubmit}
                submitButtonText="Submit (Preview)"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="mapping">
        <FieldMappingPreview fields={formFields} />
      </TabsContent>
    </Tabs>
  );
}

