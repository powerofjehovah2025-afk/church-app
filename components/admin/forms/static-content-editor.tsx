"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import type { FormStaticContent } from "@/types/database.types";

interface StaticContentEditorProps {
  formType: "welcome" | "membership";
  staticContent: FormStaticContent[];
  onUpdate: () => void;
}

export function StaticContentEditor({
  formType,
  staticContent,
  onUpdate,
}: StaticContentEditorProps) {
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [contentTypes, setContentTypes] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Initialize editing content from staticContent
  useEffect(() => {
    if (staticContent.length > 0) {
      const initial: Record<string, string> = {};
      const types: Record<string, string> = {};
      staticContent.forEach((content) => {
        initial[content.content_key] = content.content;
        types[content.content_key] = content.content_type;
      });
      setEditingContent(initial);
      setContentTypes(types);
    }
  }, [staticContent]);

  const commonContentKeys = [
    { key: "welcome_message", label: "Welcome Message", description: "Shown at the top of the form" },
    { key: "description", label: "Description", description: "Form description text" },
    { key: "gdpr_text", label: "GDPR Text", description: "Privacy consent text" },
    { key: "success_message", label: "Success Message", description: "Shown after successful submission" },
  ];

  const handleSave = async (contentKey: string) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/forms/${formType}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_key: contentKey,
          content: editingContent[contentKey] || "",
          content_type: contentTypes[contentKey] || "text",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let data: { error?: string } = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          // non-JSON response (e.g. 404 page)
        }
        throw new Error(data.error || `Failed to save content (${response.status})`);
      }

      setMessage({ type: "success", text: "Content saved successfully" });
      setTimeout(() => setMessage(null), 3000);
      onUpdate();
    } catch (error) {
      console.error("Error saving content:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save content",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
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

      {commonContentKeys.map(({ key, label, description }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle>{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`content_type_${key}`}>Content Type</Label>
              <Select
                value={contentTypes[key] || "text"}
                onValueChange={(value) =>
                  setContentTypes({ ...contentTypes, [key]: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Plain Text</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`content_${key}`}>{label}</Label>
              <Textarea
                id={`content_${key}`}
                value={editingContent[key] || ""}
                onChange={(e) =>
                  setEditingContent({ ...editingContent, [key]: e.target.value })
                }
                rows={6}
                placeholder={`Enter ${label.toLowerCase()}...`}
              />
            </div>
            <Button
              onClick={() => handleSave(key)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save {label}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

