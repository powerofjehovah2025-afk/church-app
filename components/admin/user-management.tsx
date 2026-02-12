"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle2, AlertCircle, Loader2, Shield, User } from "lucide-react";
import type { Profile } from "@/types/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Role {
  id: string;
  name: string;
  description: string | null;
  hierarchy_level: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [memberSkills, setMemberSkills] = useState<string>("");
  const [memberAvailability, setMemberAvailability] = useState<string>("");
  const [isSavingSkills, setIsSavingSkills] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        setMessage({ type: "error", text: "Failed to load users" });
        return;
      }

      if (data) {
        setUsers(data as Profile[]);
        setFilteredUsers(data as Profile[]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleRoleChange = async (userId: string, newRole: string, userName: string | null) => {
    setChangingRoleUserId(userId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      setMessage({
        type: "success",
        text: `Successfully updated ${userName || "user"}'s role to ${newRole}!`,
      });

      // Refresh users list
      await fetchUsers();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update user role",
      });
    } finally {
      setChangingRoleUserId(null);
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    const roleColors: Record<string, string> = {
      admin: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      member: "bg-slate-700/50 text-slate-300 border-slate-600/50",
    };
    return roleColors[role || "member"] || roleColors.member;
  };

  const handleOpenMemberDialog = async (user: Profile) => {
    setSelectedMember(user);
    
    // Fetch current skills
    try {
      const skillsResponse = await fetch(`/api/admin/members/${user.id}/skills`);
      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        setMemberSkills((skillsData.skills || []).join(", "));
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      setMemberSkills("");
    }

    // Fetch current availability
    try {
      const availabilityResponse = await fetch(`/api/admin/members/${user.id}/availability`);
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        // Format availability as simple text for now
        setMemberAvailability(JSON.stringify(availabilityData.availability || {}, null, 2));
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setMemberAvailability("");
    }
  };

  const handleSaveSkills = async () => {
    if (!selectedMember) return;

    setIsSavingSkills(true);
    try {
      const skillsArray = memberSkills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await fetch(`/api/admin/members/${selectedMember.id}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: skillsArray }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Skills updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
        await fetchUsers();
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to update skills" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update skills" });
    } finally {
      setIsSavingSkills(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!selectedMember) return;

    setIsSavingSkills(true);
    try {
      let availabilityObj = {};
      try {
        availabilityObj = JSON.parse(memberAvailability);
      } catch {
        // If not valid JSON, create empty object
        availabilityObj = {};
      }

      const response = await fetch(`/api/admin/members/${selectedMember.id}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: availabilityObj }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Availability updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
        await fetchUsers();
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to update availability" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update availability" });
    } finally {
      setIsSavingSkills(false);
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
      {/* Search Bar */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by email, name, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles (read-only) */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-400" />
            <div>
              <CardTitle className="text-white">Roles</CardTitle>
              <CardDescription className="text-slate-400">
                Assign a role to each user below. Admin can manage the app; member has standard access.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(roles.length ? roles.filter((r) => r.name === "admin" || r.name === "member") : [
              { name: "admin", description: "Full access to admin features", hierarchy_level: 1 },
              { name: "member", description: "Standard member access", hierarchy_level: 10 },
            ]).map((role) => (
              <div
                key={role.name}
                className={`rounded-lg border px-4 py-3 min-w-[180px] ${
                  role.name === "admin"
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-slate-800/50 border-slate-700/50"
                }`}
              >
                <p className="font-medium text-white capitalize">{role.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {role.description || (role.name === "admin" ? "Full access" : "Standard access")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                <CheckCircle2 className="h-5 w-5 text-green-400" />
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

      {/* Users List */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Users</CardTitle>
              <CardDescription className="text-slate-400">
                Total users: {filteredUsers.length}. Change role with the dropdown.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-white font-medium">
                        {user.full_name || "No name"}
                      </p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role || "member"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/admin/members/${user.id}`}
                      className="bg-slate-800/50 border-slate-700/50"
                    >
                      <User className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenMemberDialog(user)}
                      className="bg-slate-800/50 border-slate-700/50"
                    >
                      Edit Skills
                    </Button>
                    <Select
                      value={user.role || "member"}
                      onValueChange={(newRole) => handleRoleChange(user.id, newRole, user.full_name)}
                      disabled={changingRoleUserId === user.id}
                    >
                      <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          .filter((role) => role.name === "admin" || role.name === "member")
                          .map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {changingRoleUserId === user.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedMember?.full_name || "Member Details"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedMember?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6 mt-4">
              {/* Skills Section */}
              <div className="space-y-2">
                <Label className="text-slate-300">Skills</Label>
                <Input
                  value={memberSkills}
                  onChange={(e) => setMemberSkills(e.target.value)}
                  placeholder="Enter skills separated by commas (e.g., Music, Teaching, Administration)"
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                />
                <p className="text-xs text-slate-500">
                  Separate multiple skills with commas
                </p>
                <Button
                  onClick={handleSaveSkills}
                  disabled={isSavingSkills}
                  size="sm"
                  className="w-full"
                >
                  {isSavingSkills ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Skills"
                  )}
                </Button>
              </div>

              {/* Availability Section */}
              <div className="space-y-2">
                <Label className="text-slate-300">Availability</Label>
                <Textarea
                  value={memberAvailability}
                  onChange={(e) => setMemberAvailability(e.target.value)}
                  placeholder='Enter availability as JSON (e.g., {"monday": ["morning", "evening"], "tuesday": ["afternoon"]})'
                  className="bg-slate-800/50 border-slate-700/50 text-white font-mono text-sm"
                  rows={6}
                />
                <p className="text-xs text-slate-500">
                  Format: JSON object with days as keys and time slots as arrays
                </p>
                <Button
                  onClick={handleSaveAvailability}
                  disabled={isSavingSkills}
                  size="sm"
                  variant="outline"
                  className="w-full border-slate-700"
                >
                  {isSavingSkills ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Availability"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



