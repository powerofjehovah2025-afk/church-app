"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";
import { DynamicForm } from "@/components/forms/dynamic-form";

interface FormPreviewProps {
  formConfig: FormConfig;
  formFields: FormField[];
  staticContent: FormStaticContent[];
}

/**
 * Admin-side live preview of a dynamic form.
 * Uses the same `DynamicForm` component as the public welcome/membership pages,
 * but submits to a local state instead of the real submission endpoint.
 */
export function FormPreview({
  formConfig,
  formFields,
  staticContent,
}: FormPreviewProps) {
  const [lastSubmission, setLastSubmission] = useState<Record<string, unknown> | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">Live Preview</CardTitle>
          <CardDescription className="text-slate-400">
            This is how the form will appear to visitors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm
            formConfig={formConfig}
            formFields={formFields}
            staticContent={staticContent}
            onSubmit={async (values) => {
              // In preview we just capture the data locally and do not hit the API.
              setLastSubmission(values);
            }}
            isLoading={false}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">Preview Submission</CardTitle>
          <CardDescription className="text-slate-400">
            When you submit the preview form, the captured values will be shown here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lastSubmission ? (
            <pre className="text-xs text-slate-200 bg-slate-950/60 rounded-md p-3 overflow-auto">
              {JSON.stringify(lastSubmission, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-slate-400">
              Fill out the form and click submit to see the payload that will be sent.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FormPreview;

