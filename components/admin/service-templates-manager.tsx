"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, CheckCircle2, AlertCircle, Clock, X } from "lucide-react";
import type { ServiceTemplate, DutyType } from "@/types/database.types";

interface TemplateWithDutyTypes extends ServiceTemplate {
  dutyTypes?: Array<{
    id: string;
    duty_type_id: string;
    is_required: boolean;
    duty_type: DutyType;
  }>;
}

export function ServiceTemplatesManager() {
  const [templates, setTemplates] = useState<TemplateWithDutyTypes[]>([]);
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDutyTypesDialogOpen, setIsDutyTypesDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultTime, setDefaultTime] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Duty types management
  const [selectedDutyTypeId, setSelectedDutyTypeId] = useState("");
  const [isRequired, setIsRequired] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/rota/templates");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || `Failed to load templates (${response.status})`,
        });
        return;
      }

      const data = await response.json();
      // Fetch duty types for each template
      const templatesWithDutyTypes = await Promise.all(
        (data.templates || []).map(async (template: ServiceTemplate) => {
          const dutyTypesResponse = await fetch(
            `/api/admin/rota/templates/${template.id}/duty-types`
          );
          if (dutyTypesResponse.ok) {
            const dutyTypesData = await dutyTypesResponse.json();
            return {
              ...template,
              dutyTypes: dutyTypesData.dutyTypes || [],
            };
          }
          return { ...template, dutyTypes: [] };
        })
      );
      setTemplates(templatesWithDutyTypes);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setMessage({
        type: "error",
        text: `Failed to load templates: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDutyTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/rota/duty-types");
      if (response.ok) {
        const data = await response.json();
        setDutyTypes(data.dutyTypes || []);
      }
    } catch (error) {
      console.error("Error fetching duty types:", error);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchDutyTypes();
  }, [fetchTemplates, fetchDutyTypes]);

  const handleOpenDialog = (template?: TemplateWithDutyTypes) => {
    if (template) {
      setEditingId(template.id);
      setName(template.name);
      setDescription(template.description || "");
      setDefaultTime(template.default_time || "");
      setIsActive(template.is_active);
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
      setDefaultTime("");
      setIsActive(true);
    }
    setIsDialogOpen(true);
    setMessage(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setDefaultTime("");
    setIsActive(true);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = editingId
        ? `/api/admin/rota/templates/${editingId}`
        : "/api/admin/rota/templates";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          default_time: defaultTime || null,
          is_active: isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save template");
      }

      setMessage({
        type: "success",
        text: editingId ? "Template updated successfully!" : "Template created successfully!",
      });

      handleCloseDialog();
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save template",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template? This will set it as inactive.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rota/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete template");
      }

      setMessage({
        type: "success",
        text: "Template deleted successfully!",
      });

      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete template",
      });
    }
  };

  const handleOpenDutyTypesDialog = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedDutyTypeId("");
    setIsRequired(false);
    setIsDutyTypesDialogOpen(true);
  };

  const handleCloseDutyTypesDialog = () => {
    setIsDutyTypesDialogOpen(false);
    setSelectedTemplateId(null);
    setSelectedDutyTypeId("");
    setIsRequired(false);
  };

  const handleAddDutyType = async () => {
    if (!selectedTemplateId || !selectedDutyTypeId) {
      setMessage({
        type: "error",
        text: "Please select a duty type",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/rota/templates/${selectedTemplateId}/duty-types`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duty_type_id: selectedDutyTypeId,
            is_required: isRequired,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add duty type");
      }

      setMessage({
        type: "success",
        text: "Duty type added to template successfully!",
      });

      handleCloseDutyTypesDialog();
      fetchTemplates();
    } catch (error) {
      console.error("Error adding duty type:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add duty type",
      });
    }
  };

  const handleRemoveDutyType = async (templateId: string, dutyTypeId: string) => {
    if (!confirm("Are you sure you want to remove this duty type from the template?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/rota/templates/${templateId}/duty-types?duty_type_id=${dutyTypeId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove duty type");
      }

      setMessage({
        type: "success",
        text: "Duty type removed from template successfully!",
      });

      fetchTemplates();
    } catch (error) {
      console.error("Error removing duty type:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to remove duty type",
      });
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const availableDutyTypes = dutyTypes.filter(
    (dt) =>
      dt.is_active &&
      !selectedTemplate?.dutyTypes?.some((tdt) => tdt.duty_type_id === dt.id)
  );

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === "error"
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-green-500/50 bg-green-500/10 text-green-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Service Templates</CardTitle>
              <CardDescription className="text-slate-400">
                Create reusable service configurations with default duty types
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-slate-900 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Template" : "Create New Template"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingId
                      ? "Update the template information"
                      : "Create a reusable service template"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Template Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sunday Service, Midweek Service"
                      required
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-300">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this service template..."
                      className="border-slate-700 bg-slate-800 text-white"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultTime" className="text-slate-300">
                      Default Time
                    </Label>
                    <Input
                      id="defaultTime"
                      type="time"
                      value={defaultTime}
                      onChange={(e) => setDefaultTime(e.target.value)}
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-700"
                    />
                    <Label htmlFor="isActive" className="text-slate-300">
                      Active
                    </Label>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      disabled={isSubmitting}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !name.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingId ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No templates created yet.</p>
              <p className="mt-2 text-sm">Click &quot;Create Template&quot; to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="border-slate-800 bg-slate-800/50"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white">{template.name}</h3>
                          {!template.is_active && (
                            <Badge variant="outline" className="border-slate-600 text-slate-400">
                              Inactive
                            </Badge>
                          )}
                          {template.default_time && (
                            <Badge variant="outline" className="border-blue-600 text-blue-400">
                              <Clock className="mr-1 h-3 w-3" />
                              {template.default_time}
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-slate-400 mb-3">{template.description}</p>
                        )}
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 mb-2">Default Duty Types:</p>
                          {template.dutyTypes && template.dutyTypes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {template.dutyTypes.map((tdt) => (
                                <Badge
                                  key={tdt.id}
                                  variant="outline"
                                  className="border-slate-600 text-slate-300"
                                >
                                  {tdt.duty_type?.name || "Unknown"}
                                  {tdt.is_required && (
                                    <span className="ml-1 text-red-400">*</span>
                                  )}
                                  <button
                                    onClick={() => handleRemoveDutyType(template.id, tdt.duty_type_id)}
                                    className="ml-2 hover:text-red-400"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No duty types configured</p>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDutyTypesDialog(template.id)}
                            className="mt-2 text-blue-400 hover:text-blue-300"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Duty Type
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(template)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duty Types Management Dialog */}
      <Dialog open={isDutyTypesDialogOpen} onOpenChange={setIsDutyTypesDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Add Duty Type to Template</DialogTitle>
            <DialogDescription className="text-slate-400">
              Select a duty type to add to this template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Duty Type</Label>
              <Select value={selectedDutyTypeId} onValueChange={setSelectedDutyTypeId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Select a duty type" />
                </SelectTrigger>
                <SelectContent>
                  {availableDutyTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="rounded border-slate-700"
              />
              <Label htmlFor="isRequired" className="text-slate-300">
                Required (must be filled)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDutyTypesDialog}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddDutyType}
              disabled={!selectedDutyTypeId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

