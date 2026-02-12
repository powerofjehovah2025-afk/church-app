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
import { Plus, Edit, Trash2, Loader2, CheckCircle2, AlertCircle, Users, UserPlus, UserMinus } from "lucide-react";
import type { MinistryTeam } from "@/types/database.types";

interface TeamWithMembers extends MinistryTeam {
  leader?: { id: string; full_name: string | null; email: string | null };
  members?: Array<{
    id: string;
    member_id: string;
    role: string;
    member: { id: string; full_name: string | null; email: string | null };
  }>;
}

export function MinistryTeamsManager() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [members, setMembers] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Member management
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberRole, setMemberRole] = useState<"member" | "leader" | "co-leader">("member");

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/ministry-teams");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || `Failed to load teams (${response.status})`,
        });
        return;
      }

      const data = await response.json();
      // Fetch members for each team
      const teamsWithMembers = await Promise.all(
        (data.teams || []).map(async (team: MinistryTeam) => {
          const membersResponse = await fetch(`/api/admin/ministry-teams/${team.id}/members`);
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            return {
              ...team,
              members: membersData.members || [],
            };
          }
          return { ...team, members: [] };
        })
      );
      setTeams(teamsWithMembers);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setMessage({
        type: "error",
        text: `Failed to load teams: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchMembers();
  }, [fetchTeams, fetchMembers]);

  const handleOpenDialog = (team?: TeamWithMembers) => {
    if (team) {
      setEditingId(team.id);
      setName(team.name);
      setDescription(team.description || "");
      setLeaderId(team.leader_id || "");
      setIsActive(team.is_active);
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
      setLeaderId("");
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
    setLeaderId("");
    setIsActive(true);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = editingId
        ? `/api/admin/ministry-teams/${editingId}`
        : "/api/admin/ministry-teams";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          leader_id: leaderId || null,
          is_active: isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save team");
      }

      setMessage({
        type: "success",
        text: editingId ? "Team updated successfully!" : "Team created successfully!",
      });

      handleCloseDialog();
      fetchTeams();
    } catch (error) {
      console.error("Error saving team:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save team",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team? This will set it as inactive.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ministry-teams/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete team");
      }

      setMessage({
        type: "success",
        text: "Team deleted successfully!",
      });

      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete team",
      });
    }
  };

  const handleOpenMemberDialog = (teamId: string) => {
    setSelectedTeamId(teamId);
    setSelectedMemberId("");
    setMemberRole("member");
    setIsMemberDialogOpen(true);
  };

  const handleCloseMemberDialog = () => {
    setIsMemberDialogOpen(false);
    setSelectedTeamId(null);
    setSelectedMemberId("");
    setMemberRole("member");
  };

  const handleAddMember = async () => {
    if (!selectedTeamId || !selectedMemberId) {
      setMessage({
        type: "error",
        text: "Please select a member",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/ministry-teams/${selectedTeamId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            member_id: selectedMemberId,
            role: memberRole,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add member");
      }

      setMessage({
        type: "success",
        text: "Member added to team successfully!",
      });

      handleCloseMemberDialog();
      fetchTeams();
    } catch (error) {
      console.error("Error adding member:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add member",
      });
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/ministry-teams/${teamId}/members?member_id=${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove member");
      }

      setMessage({
        type: "success",
        text: "Member removed from team successfully!",
      });

      fetchTeams();
    } catch (error) {
      console.error("Error removing member:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to remove member",
      });
    }
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const availableMembers = members.filter(
    (m) => !selectedTeam?.members?.some((tm) => tm.member_id === m.id)
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white">Ministry Teams</CardTitle>
              <CardDescription className="text-slate-400">
                Organize members into ministry teams
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-slate-900 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Team" : "Create New Team"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingId
                      ? "Update the team information"
                      : "Create a new ministry team"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Team Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Worship Team, Ushering Team"
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
                      placeholder="Describe the team's purpose..."
                      className="border-slate-700 bg-slate-800 text-white"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaderId" className="text-slate-300">
                      Team Leader
                    </Label>
                    <Select value={leaderId} onValueChange={setLeaderId}>
                      <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                        <SelectValue placeholder="Select a leader (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name || member.email || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          ) : teams.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No teams created yet.</p>
              <p className="mt-2 text-sm">Click &quot;Create Team&quot; to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <Card key={team.id} className="border-slate-800 bg-slate-800/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white">{team.name}</h3>
                          {!team.is_active && (
                            <Badge variant="outline" className="border-slate-600 text-slate-400">
                              Inactive
                            </Badge>
                          )}
                          {team.leader && (
                            <Badge variant="outline" className="border-blue-600 text-blue-400">
                              Leader: {team.leader.full_name || team.leader.email}
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-slate-600 text-slate-400">
                            {team.members?.length || 0} member{team.members?.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        {team.description && (
                          <p className="text-sm text-slate-400 mb-3">{team.description}</p>
                        )}
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 mb-2">Team Members:</p>
                          {team.members && team.members.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {team.members.map((tm) => (
                                <Badge
                                  key={tm.id}
                                  variant="outline"
                                  className="border-slate-600 text-slate-300"
                                >
                                  {tm.member?.full_name || tm.member?.email || "Unknown"}
                                  {tm.role !== "member" && (
                                    <span className="ml-1 text-blue-400">({tm.role})</span>
                                  )}
                                  <button
                                    onClick={() => handleRemoveMember(team.id, tm.member_id)}
                                    className="ml-2 hover:text-red-400"
                                  >
                                    <UserMinus className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No members yet</p>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMemberDialog(team.id)}
                            className="mt-2 text-blue-400 hover:text-blue-300"
                          >
                            <UserPlus className="mr-1 h-3 w-3" />
                            Add Member
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(team)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(team.id)}
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

      {/* Add Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Add Member to Team</DialogTitle>
            <DialogDescription className="text-slate-400">
              Select a member to add to this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || member.email || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Role</Label>
              <Select
                value={memberRole}
                onValueChange={(value) => setMemberRole(value as "member" | "leader" | "co-leader")}
              >
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="co-leader">Co-Leader</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseMemberDialog}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddMember}
              disabled={!selectedMemberId}
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

