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
import { Search, CheckCircle2, AlertCircle, Loader2, Settings } from "lucide-react";
import type { Profile } from "@/types/database.types";
import Link from "next/link";

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
      pastor: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      elder: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
      deacon: "bg-teal-500/20 text-teal-300 border-teal-500/50",
      leader: "bg-green-500/20 text-green-300 border-green-500/50",
      member: "bg-slate-700/50 text-slate-300 border-slate-600/50",
      volunteer: "bg-orange-500/20 text-orange-300 border-orange-500/50",
    };
    return roleColors[role || "member"] || roleColors.member;
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
              <CardTitle className="text-white">User Management</CardTitle>
              <CardDescription className="text-slate-400">
                Manage user roles and permissions. Total users: {filteredUsers.length}
              </CardDescription>
            </div>
            <Link href="/admin/roles">
              <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700/50">
                <Settings className="h-4 w-4 mr-2" />
                Manage Roles
              </Button>
            </Link>
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
                    <Select
                      value={user.role || "member"}
                      onValueChange={(newRole) => handleRoleChange(user.id, newRole, user.full_name)}
                      disabled={changingRoleUserId === user.id}
                    >
                      <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
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
    </div>
  );
}



