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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, Shield, AlertCircle } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  hierarchy_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hierarchyLevel, setHierarchyLevel] = useState(100);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/roles");
      if (!response.ok) {
        throw new Error("Failed to load roles");
      }
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load roles",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingId(role.id);
      setName(role.name);
      setDescription(role.description || "");
      setHierarchyLevel(role.hierarchy_level);
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
      setHierarchyLevel(100);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setHierarchyLevel(100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = editingId
        ? `/api/admin/roles/${editingId}`
        : "/api/admin/roles";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || null,
          hierarchy_level: hierarchyLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save role");
      }

      setMessage({
        type: "success",
        text: editingId
          ? "Role updated successfully!"
          : "Role created successfully!",
      });

      handleCloseDialog();
      await fetchRoles();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save role",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the role "${roleName}"? This will set it as inactive.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete role");
      }

      setMessage({
        type: "success",
        text: "Role deleted successfully!",
      });

      await fetchRoles();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete role",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message && (
        <Card
          className={`${
            message.type === "success"
              ? "bg-green-500/20 border-green-500/50"
              : "bg-red-500/20 border-red-500/50"
          } backdrop-blur-md shadow-xl`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {message.type === "success" ? (
                <Shield className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <p
                className={
                  message.type === "success" ? "text-green-300" : "text-red-300"
                }
              >
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Roles Management</CardTitle>
              <CardDescription className="text-slate-400">
                Create and manage user roles. Lower hierarchy level = higher authority.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingId ? "Edit Role" : "Create Role"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingId
                      ? "Update role details"
                      : "Create a new role for user management"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">
                        Role Name *
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Pastor, Elder, Leader"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                        disabled={!!editingId} // Can't change name of existing role
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the role's responsibilities..."
                        className="bg-slate-800 border-slate-700 text-white"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hierarchy" className="text-white">
                        Hierarchy Level *
                      </Label>
                      <Input
                        id="hierarchy"
                        type="number"
                        value={hierarchyLevel}
                        onChange={(e) =>
                          setHierarchyLevel(Number(e.target.value))
                        }
                        placeholder="Lower number = higher authority"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                        min={1}
                      />
                      <p className="text-xs text-slate-400">
                        Lower numbers have higher authority. Admin = 1, Member = 10
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      className="border-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : editingId ? (
                        "Update Role"
                      ) : (
                        "Create Role"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No roles found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-medium">{role.name}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                        Level {role.hierarchy_level}
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-sm text-slate-400 mt-1">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(role)}
                      className="border-slate-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {role.name !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(role.id, role.name)}
                        className="border-red-700 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

