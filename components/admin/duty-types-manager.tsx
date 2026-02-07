"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { DutyType } from "@/types/database.types";

export function DutyTypesManager() {
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchDutyTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/rota/duty-types");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || `Failed to load duty types (${response.status})`,
        });
        return;
      }

      const data = await response.json();
      setDutyTypes(data.dutyTypes || []);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching duty types:", error);
      setMessage({
        type: "error",
        text: `Failed to load duty types: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDutyTypes();
  }, [fetchDutyTypes]);

  const handleOpenDialog = (dutyType?: DutyType) => {
    if (dutyType) {
      setEditingId(dutyType.id);
      setName(dutyType.name);
      setDescription(dutyType.description || "");
      setIsActive(dutyType.is_active);
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
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
    setIsActive(true);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = "/api/admin/rota/duty-types";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { id: editingId, name, description, is_active: isActive }
            : { name, description, is_active: isActive }
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save duty type");
      }

      setMessage({
        type: "success",
        text: editingId ? "Duty type updated successfully!" : "Duty type created successfully!",
      });

      handleCloseDialog();
      fetchDutyTypes();
    } catch (error) {
      console.error("Error saving duty type:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save duty type",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this duty type?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rota/duty-types?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to deactivate duty type");
      }

      setMessage({
        type: "success",
        text: "Duty type deactivated successfully!",
      });

      fetchDutyTypes();
    } catch (error) {
      console.error("Error deactivating duty type:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to deactivate duty type",
      });
    }
  };

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
              <CardTitle className="text-white">Duty Types</CardTitle>
              <CardDescription className="text-slate-400">
                Manage duty types for service assignments (e.g., Ushers, Choir, Media)
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Duty Type
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-slate-900 text-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Duty Type" : "Create New Duty Type"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingId
                      ? "Update the duty type information"
                      : "Add a new duty type for service assignments"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Ushers, Choir, Media"
                      required
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-300">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description"
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800"
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
          ) : dutyTypes.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No duty types created yet.</p>
              <p className="mt-2 text-sm">Click &quot;Create Duty Type&quot; to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dutyTypes.map((dutyType) => (
                <div
                  key={dutyType.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{dutyType.name}</h3>
                      {!dutyType.is_active && (
                        <span className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    {dutyType.description && (
                      <p className="mt-1 text-sm text-slate-400">{dutyType.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(dutyType)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(dutyType.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

