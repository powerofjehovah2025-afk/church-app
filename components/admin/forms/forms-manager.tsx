"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { FormConfig } from "@/types/database.types";
import { FormEditor } from "./form-editor";
import { FormErrorBoundary } from "./error-boundary";

export function FormsManager() {
  const [formConfigs, setFormConfigs] = useState<FormConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFormType, setSelectedFormType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/forms");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load forms");
      }

      setFormConfigs(data.formConfigs || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load forms",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleEdit = (formType: string) => {
    setSelectedFormType(formType);
  };

  const handleBack = () => {
    setSelectedFormType(null);
    fetchForms(); // Refresh list when going back
  };

  if (selectedFormType) {
    return (
      <FormErrorBoundary>
        <FormEditor
          formType={selectedFormType as "welcome" | "membership"}
          onBack={handleBack}
        />
      </FormErrorBoundary>
    );
  }

  const formTypeLabels: Record<string, string> = {
    welcome: "Welcome Form",
    membership: "Membership Form",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Form Builder</h1>
          <p className="text-muted-foreground mt-2">
            Manage and customize your church forms
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {["welcome", "membership"].map((formType) => {
            const config = formConfigs.find((fc) => fc.form_type === formType);
            return (
              <Card key={formType} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <FileText className="h-8 w-8 text-primary" />
                    {config?.is_active ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <CardTitle className="mt-4">
                    {formTypeLabels[formType] || formType}
                  </CardTitle>
                  <CardDescription>
                    {config?.description || "Configure form fields and content"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Status:{" "}
                      <span
                        className={
                          config?.is_active
                            ? "text-green-600 font-medium"
                            : "text-gray-500"
                        }
                      >
                        {config?.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleEdit(formType)}
                      className="w-full"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {config ? "Edit Form" : "Create Form"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

