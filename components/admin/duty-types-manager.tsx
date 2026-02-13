"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import type { Database } from "@/types/database.types";

type DutyType = Database["public"]["Tables"]["duty_types"]["Row"];

/**
 * Duty Types manager for the Rota page.
 * Allows creating and viewing duty types.
 */
export function DutyTypesManager() {
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/rota/duty-types");
        if (response.ok) {
          const data = await response.json();
          setDutyTypes(data.dutyTypes || []);
        }
      } catch (error) {
        console.error("Error loading duty types:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleOpenDialog = () => {
    setName("");
    setDescription("");
    setIsActive(true);
    setIsDialogOpen(true);
    setMessage(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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
      const response = await fetch("/api/admin/rota/duty-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          is_active: isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create duty type");
      }

      setMessage({
        type: "success",
        text: "Duty type created successfully!",
      });

      // Reload duty types
      const reloadResponse = await fetch("/api/admin/rota/duty-types");
      if (reloadResponse.ok) {
        const data = await reloadResponse.json();
        setDutyTypes(data.dutyTypes || []);
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error creating duty type:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create duty type",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white">Duty Types</CardTitle>
              <CardDescription className="text-slate-400">
                Roles that can be assigned on the rota. Create new duty types here.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Duty Type
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-slate-900 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Duty Type</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Add a new role that can be assigned on the rota
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Duty Type Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Worship Leader, Usher, Sound Engineer"
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
                      placeholder="Describe this duty type..."
                      className="border-slate-700 bg-slate-800 text-white"
                      rows={3}
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
                          Creating...
                        </>
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
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : dutyTypes.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p>No duty types defined yet.</p>
              <p className="mt-2 text-sm">Click &quot;Create Duty Type&quot; to get started.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dutyTypes.map((duty) => (
                <Card
                  key={duty.id}
                  className="border-slate-800 bg-slate-800/50"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{duty.name}</h3>
                        {duty.description && (
                          <p className="mt-1 text-xs text-slate-400">
                            {duty.description}
                          </p>
                        )}
                      </div>
                      {!duty.is_active && (
                        <Badge
                          variant="outline"
                          className="border-slate-600 text-slate-400 text-[10px]"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DutyTypesManager;

