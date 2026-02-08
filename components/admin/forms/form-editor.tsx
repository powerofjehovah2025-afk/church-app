"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Loader2, Copy, GripVertical, GitBranch, Rocket, FileText } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";
import { FieldEditorDialog } from "./field-editor-dialog";
import { StaticContentEditor } from "./static-content-editor";
import { FormPreview } from "./form-preview";

interface FormEditorProps {
  formType: "welcome" | "membership" | "newcomer";
  onBack: () => void;
}

export function FormEditor({ formType, onBack }: FormEditorProps) {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [staticContent, setStaticContent] = useState<FormStaticContent[]>([]);
  const [allVersions, setAllVersions] = useState<FormConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);

  const formTypeLabels: Record<string, string> = {
    welcome: "Welcome Form",
    membership: "Membership Form",
    newcomer: "Newcomer Form",
  };

  const fetchFormData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/forms/${formType}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load form");
      }

      setFormConfig(data.formConfig);
      setFormFields(data.formFields || []);
      setStaticContent(data.staticContent || []);
      setAllVersions(data.allVersions || []);
    } catch (error) {
      console.error("Error fetching form data:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load form",
      });
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
    try {
      const response = await fetch(`/api/admin/forms/${formType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version_id: formConfig?.id,
          ...updates,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update form");
      }

      const data = await response.json();
      setFormConfig(data.formConfig);
      await fetchFormData(); // Refresh to get updated versions
      setMessage({ type: "success", text: "Form updated successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating form:", error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {formTypeLabels[formType]}
          </h1>
          <p className="text-muted-foreground mt-2">
            Edit form fields, content, and settings
          </p>
        </div>
        <div className="flex gap-2">
          {formConfig.status === "draft" && (
            <Button
              onClick={() => handlePublishVersion(formConfig.id)}
              disabled={isPublishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              Publish Version
            </Button>
          )}
          <Button
            onClick={handleCreateVersion}
            disabled={isCreatingVersion}
            variant="outline"
          >
            {isCreatingVersion ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <GitBranch className="h-4 w-4 mr-2" />
            )}
            Create New Version
          </Button>
        </div>
      </div>

      {/* Version Selector */}
      {allVersions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Versions</CardTitle>
            <CardDescription>Switch between versions or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allVersions.map((version) => (
                <div
                  key={version.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    version.id === formConfig?.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Version {version.version}
                          {version.version_name && ` - ${version.version_name}`}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
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
                      <div className="text-sm text-muted-foreground">
                        {version.title} • Updated {new Date(version.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {version.id !== formConfig?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchVersion(version.id)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Switch
                      </Button>
                    )}
                    {version.status === "draft" && version.id !== formConfig?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishVersion(version.id)}
                        disabled={isPublishing}
                      >
                        <Rocket className="h-4 w-4 mr-1" />
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Currently editing:</span>
          <span className="font-medium text-foreground">
            Version {formConfig.version}
            {formConfig.version_name && ` - ${formConfig.version_name}`}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs ${
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

      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="content">Static Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription>
                    Add, edit, and reorder form fields
                  </CardDescription>
                </div>
                <Button onClick={handleAddField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formFields.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
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
                                className={`flex items-center gap-3 p-4 border rounded-lg bg-background transition-colors ${
                                  snapshot.isDragging
                                    ? "shadow-lg border-primary"
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                >
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                      #{index + 1}
                                    </span>
                                    <span className="font-medium">{field.label}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {field.field_type} • {field.section || "General"}
                                    {field.is_required && " • Required"}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditField(field)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDuplicateField(field)}
                                    title="Duplicate field"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteField(field.id)}
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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure form title, description, and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={formConfig.title}
                  onChange={(e) =>
                    handleUpdateConfig({ title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formConfig.description || ""}
                  onChange={(e) =>
                    handleUpdateConfig({ description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formConfig.is_active}
                  onChange={(e) =>
                    handleUpdateConfig({ is_active: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Form is active (visible to users)
                </label>
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

