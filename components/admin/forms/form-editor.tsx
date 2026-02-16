"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Loader2, Copy, GripVertical, GitBranch, Rocket, FileText } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";
import { FieldEditorDialog } from "./field-editor-dialog";
import { StaticContentEditor } from "./static-content-editor";
import { FormPreview } from "./form-preview";
import { BusinessRulesEditor } from "./business-rules-editor";
import type { FormSubmissionRule } from "@/types/database.types";

interface FormEditorProps {
  formType: "welcome" | "membership";
  onBack: () => void;
}

export function FormEditor({ formType, onBack }: FormEditorProps) {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [staticContent, setStaticContent] = useState<FormStaticContent[]>([]);
  const [allVersions, setAllVersions] = useState<FormConfig[]>([]);
  const [submissionRules, setSubmissionRules] = useState<FormSubmissionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  // Local state for settings inputs to allow immediate typing
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [activeTab, setActiveTab] = useState("fields");

  const formTypeLabels: Record<string, string> = {
    welcome: "Welcome Form",
    membership: "Membership Form",
  };

  const TAB_OPTIONS = [
    { value: "fields", label: "Fields" },
    { value: "content", label: "Static Content" },
    { value: "rules", label: "Business Rules" },
    { value: "settings", label: "Settings" },
    { value: "preview", label: "Preview" },
  ] as const;

  const fetchFormData = async () => {
    setIsLoading(true);
    setMessage(null); // Clear any previous messages
    try {
      const response = await fetch(`/api/admin/forms/${formType}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load form");
      }

      // Ensure we have a valid form config
      if (!data.formConfig || !data.formConfig.id) {
        throw new Error("Form configuration not found. Please create the form first.");
      }

      setFormConfig(data.formConfig);
      setFormFields(data.formFields || []);
      setStaticContent(data.staticContent || []);
      setAllVersions(data.allVersions || []);
      
      // Fetch submission rules
      if (data.formConfig?.id) {
        try {
          const rulesResponse = await fetch(`/api/admin/forms/${formType}/rules`);
          if (rulesResponse.ok) {
            const rulesData = await rulesResponse.json();
            setSubmissionRules(rulesData.rules || []);
          }
        } catch (error) {
          console.error("Error fetching rules:", error);
          // Don't fail the whole form load if rules fail
        }
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load form";
      setMessage({
        type: "error",
        text: errorMessage,
      });
      // Clear form data on error
      setFormConfig(null);
      setFormFields([]);
      setStaticContent([]);
      setAllVersions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType]);

  const handleAddField = () => {
    setEditingField(null);
    setIsFieldDialogOpen(true);
  };

  const handleEditField = (field: FormField) => {
    // Validate field before opening dialog
    if (!field || !field.id || !field.field_key || !field.field_type || !field.label) {
      console.error("Invalid field object passed to handleEditField:", field);
      setMessage({
        type: "error",
        text: "Cannot edit field: Invalid field data. Please refresh and try again.",
      });
      return;
    }
    setEditingField(field);
    setIsFieldDialogOpen(true);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/forms/${formType}/fields/${fieldId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete field");
      }

      await fetchFormData();
      setMessage({ type: "success", text: "Field deleted successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting field:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete field",
      });
    }
  };

  const handleDuplicateField = async (field: FormField) => {
    try {
      const duplicatedField = {
        ...field,
        field_key: `${field.field_key}_copy`,
        label: `${field.label} (Copy)`,
        display_order: field.display_order + 1,
      };
      delete (duplicatedField as { id?: string }).id; // Remove ID for new field

      const response = await fetch(`/api/admin/forms/${formType}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...duplicatedField,
          version_id: formConfig?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to duplicate field");
      }

      await fetchFormData();
      setMessage({ type: "success", text: "Field duplicated successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error duplicating field:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to duplicate field",
      });
    }
  };

  const handleDragEnd = async (result: {
    destination: { index: number } | null;
    source: { index: number };
    draggableId: string;
  }) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Reorder fields locally for immediate feedback
    const reorderedFields = Array.from(formFields);
    const [removed] = reorderedFields.splice(sourceIndex, 1);
    reorderedFields.splice(destIndex, 0, removed);

    // Update display_order for all affected fields
    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      display_order: index,
    }));

    setFormFields(updatedFields);

    // Update all fields' display_order in the database
    try {
      const updatePromises = updatedFields.map((field, index) =>
        fetch(`/api/admin/forms/${formType}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: field.id,
            display_order: index,
          }),
        })
      );

      await Promise.all(updatePromises);
      setMessage({ type: "success", text: "Field order updated" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error updating field order:", error);
      // Revert on error
      await fetchFormData();
      setMessage({
        type: "error",
        text: "Failed to update field order. Reverting...",
      });
    }
  };

  const handleSaveField = async (fieldData: Partial<FormField>) => {
    try {
      const response = await fetch(`/api/admin/forms/${formType}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingField?.id,
          version_id: formConfig?.id,
          ...fieldData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save field");
      }

      await fetchFormData();
      setIsFieldDialogOpen(false);
      setEditingField(null);
      setMessage({ type: "success", text: "Field saved successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving field:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save field",
      });
    }
  };

  const handleUpdateConfig = async (updates: Partial<FormConfig>) => {
    if (!formConfig?.id) return;
    
    // Optimistically update local state
    setFormConfig((prev) => (prev ? { ...prev, ...updates } : null));
    
    try {
      const response = await fetch(`/api/admin/forms/${formType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version_id: formConfig.id,
          ...updates,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update form");
      }

      const data = await response.json();
      setFormConfig(data.formConfig);
      // Update local state to match server response
      if (updates.title !== undefined) setLocalTitle(data.formConfig?.title || "");
      if (updates.description !== undefined) setLocalDescription(data.formConfig?.description || "");
      setMessage({ type: "success", text: "Form updated successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating form:", error);
      // Revert optimistic update on error by refreshing
      await fetchFormData();
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update form",
      });
    }
  };

  const handleCreateVersion = async () => {
    const versionName = prompt("Enter a name for this version (optional):");
    setIsCreatingVersion(true);
    try {
      const response = await fetch(`/api/admin/forms/${formType}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_name: versionName || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create version");
      }

      await fetchFormData();
      setMessage({ type: "success", text: "New version created successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error creating version:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create version",
      });
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handlePublishVersion = async (versionId: string) => {
    if (!confirm("Are you sure you want to publish this version? This will archive the current published version.")) {
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/forms/${formType}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_id: versionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish version");
      }

      await fetchFormData();
      setMessage({ type: "success", text: "Version published successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error publishing version:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to publish version",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSwitchVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/admin/forms/${formType}/${versionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load version");
      }

      setFormConfig(data.formConfig);
      setFormFields(data.formFields || []);
      setStaticContent(data.staticContent || []);
    } catch (error) {
      console.error("Error loading version:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load version",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="space-y-6">
        <Button onClick={onBack} variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Form configuration not found. Please create it first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {formTypeLabels[formType]}
          </h1>
          <p className="mt-1 text-base text-muted-foreground text-pretty break-words sm:mt-2">
            Edit form fields, content, and settings
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          {formConfig.status === "draft" && (
            <Button
              onClick={() => handlePublishVersion(formConfig.id)}
              disabled={isPublishing}
              className="min-h-[44px] w-full shrink-0 bg-green-600 hover:bg-green-700 sm:w-auto"
            >
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-2 h-4 w-4 shrink-0" />
              )}
              Publish Version
            </Button>
          )}
          <Button
            onClick={handleCreateVersion}
            disabled={isCreatingVersion}
            variant="outline"
            className="min-h-[44px] w-full shrink-0 sm:w-auto"
          >
            {isCreatingVersion ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GitBranch className="mr-2 h-4 w-4 shrink-0" />
            )}
            Create New Version
          </Button>
        </div>
      </div>

      {/* Version Selector */}
      {allVersions.length > 1 && (
        <Card className="min-w-0">
          <CardHeader className="min-w-0">
            <CardTitle className="text-lg">Versions</CardTitle>
            <CardDescription className="text-pretty break-words">
              Switch between versions or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="space-y-2">
              {allVersions.map((version) => (
                <div
                  key={version.id}
                  className={`flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                    version.id === formConfig?.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">
                        Version {version.version}
                        {version.version_name && ` - ${version.version_name}`}
                      </span>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                          version.status === "published"
                            ? "bg-green-100 text-green-800"
                            : version.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {version.status}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm text-muted-foreground">
                      {version.title} • Updated {new Date(version.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {version.id !== formConfig?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchVersion(version.id)}
                        className="min-h-[44px] shrink-0 sm:w-auto"
                      >
                        <FileText className="mr-1 h-4 w-4 shrink-0" />
                        Switch
                      </Button>
                    )}
                    {version.status === "draft" && version.id !== formConfig?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishVersion(version.id)}
                        disabled={isPublishing}
                        className="min-h-[44px] shrink-0 sm:w-auto"
                      >
                        <Rocket className="mr-1 h-4 w-4 shrink-0" />
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Version Info */}
      {formConfig && (
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="shrink-0">Currently editing:</span>
          <span className="min-w-0 truncate font-medium text-foreground">
            Version {formConfig.version}
            {formConfig.version_name && ` - ${formConfig.version_name}`}
          </span>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs ${
              formConfig.status === "published"
                ? "bg-green-100 text-green-800"
                : formConfig.status === "draft"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {formConfig.status}
          </span>
        </div>
      )}

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0 w-full space-y-4">
        {/* Mobile: dropdown so all tabs are visible */}
        <div className="md:hidden w-full">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full min-h-[44px]">
              <SelectValue placeholder="Choose section" />
            </SelectTrigger>
            <SelectContent>
              {TAB_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="min-h-[44px]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: horizontal tabs */}
        <TabsList className="hidden md:flex w-full min-w-0 flex-nowrap overflow-x-auto no-scrollbar px-1 py-1 sm:px-2">
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="content">Static Content</TabsTrigger>
          <TabsTrigger value="rules">Business Rules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <Card className="min-w-0">
            <CardHeader className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription className="text-pretty break-words">
                    Add, edit, and reorder form fields
                  </CardDescription>
                </div>
                <Button onClick={handleAddField} className="min-h-[44px] w-full shrink-0 sm:w-auto">
                  <Plus className="mr-2 h-4 w-4 shrink-0" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="min-w-0">
              {formFields.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No fields yet. Click &quot;Add Field&quot; to get started.
                </p>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {formFields.map((field, index) => (
                          <Draggable
                            key={field.id}
                            draggableId={field.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex min-w-0 flex-col gap-3 rounded-lg border bg-background p-4 transition-colors sm:flex-row sm:items-center ${
                                  snapshot.isDragging
                                    ? "border-primary shadow-lg"
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                  >
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                        #{index + 1}
                                      </span>
                                      <span className="truncate font-medium">{field.label}</span>
                                    </div>
                                    <div className="mt-1 truncate text-sm text-muted-foreground">
                                      {field.field_type} • {field.section || "General"}
                                      {field.is_required && " • Required"}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex min-w-0 flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditField(field)}
                                    className="min-h-[44px] shrink-0 sm:w-auto"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDuplicateField(field)}
                                    title="Duplicate field"
                                    className="min-h-[44px] shrink-0 sm:w-auto"
                                  >
                                    <Copy className="h-4 w-4 shrink-0" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteField(field.id)}
                                    className="min-h-[44px] shrink-0 sm:w-auto"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <StaticContentEditor
            formType={formType}
            staticContent={staticContent}
            onUpdate={fetchFormData}
          />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <BusinessRulesEditor
            formFields={formFields}
            rules={submissionRules}
            onRulesChange={setSubmissionRules}
            onSave={async (rule) => {
              try {
                const response = await fetch(`/api/admin/forms/${formType}/rules`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...rule,
                    form_config_id: formConfig?.id,
                  }),
                });
                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || "Failed to save rule");
                }
                await fetchFormData();
                setMessage({ type: "success", text: "Rule saved successfully" });
                setTimeout(() => setMessage(null), 3000);
              } catch (error) {
                setMessage({
                  type: "error",
                  text: error instanceof Error ? error.message : "Failed to save rule",
                });
              }
            }}
            onDelete={async (ruleId) => {
              try {
                const response = await fetch(`/api/admin/forms/${formType}/rules/${ruleId}`, {
                  method: "DELETE",
                });
                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || "Failed to delete rule");
                }
                await fetchFormData();
                setMessage({ type: "success", text: "Rule deleted successfully" });
                setTimeout(() => setMessage(null), 3000);
              } catch (error) {
                setMessage({
                  type: "error",
                  text: error instanceof Error ? error.message : "Failed to delete rule",
                });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure form title, description, and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={localTitle}
                  onChange={(e) => {
                    setLocalTitle(e.target.value);
                    setFormConfig((prev) => (prev ? { ...prev, title: e.target.value } : null));
                  }}
                  onBlur={() => {
                    if (localTitle !== formConfig?.title) {
                      handleUpdateConfig({ title: localTitle });
                    }
                  }}
                  placeholder="Welcome Form"
                  className="bg-muted/50 border-muted-foreground/20 text-foreground placeholder:text-muted-foreground focus-visible:bg-muted/70"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={localDescription}
                  onChange={(e) => {
                    setLocalDescription(e.target.value);
                    setFormConfig((prev) => (prev ? { ...prev, description: e.target.value } : null));
                  }}
                  onBlur={() => {
                    if (localDescription !== formConfig?.description) {
                      handleUpdateConfig({ description: localDescription });
                    }
                  }}
                  placeholder="Welcome form for new visitors"
                  rows={3}
                  className="bg-muted/50 border-muted-foreground/20 text-foreground placeholder:text-muted-foreground focus-visible:bg-muted/70"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formConfig?.is_active || false}
                  onCheckedChange={(checked) =>
                    handleUpdateConfig({ is_active: checked as boolean })
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Form is active (visible to users)
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <FormPreview
            formConfig={formConfig}
            formFields={formFields}
            staticContent={staticContent}
          />
        </TabsContent>
      </Tabs>

      <FieldEditorDialog
        open={isFieldDialogOpen}
        onOpenChange={setIsFieldDialogOpen}
        field={editingField}
        onSave={handleSaveField}
      />
    </div>
  );
}

