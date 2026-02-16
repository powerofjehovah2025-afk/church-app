"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, Users, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PrayerRequest {
  id: string;
  title: string;
  request: string;
  status: string;
  priority: string;
  is_anonymous: boolean;
  member: { id: string; full_name: string | null; email: string | null } | null;
  assigned_to: string | null;
  assigned_to_profile?: { id: string; full_name: string | null; email: string | null } | null;
  team_assignments?: Array<{
    id: string;
    team_member: { id: string; full_name: string | null; email: string | null };
    assigned_at: string;
  }>;
  created_at: string;
  answered_at?: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function PrayerRequestsManager() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [updateText, setUpdateText] = useState("");
  const [updateStatus, setUpdateStatus] = useState<string>("");

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const response = await fetch(`/api/admin/prayer-requests?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        console.error("Failed to fetch prayer requests");
      }
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["admin", "member"])
        .order("full_name");

      if (data) {
        setTeamMembers(data);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const handleAssign = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(
        `/api/admin/prayer-requests/${selectedRequest.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team_member_ids: selectedTeamMembers }),
        }
      );

      if (response.ok) {
        await fetchRequests();
        setIsAssignDialogOpen(false);
        setSelectedTeamMembers([]);
      } else {
        const error = await response.json();
        alert(`Failed to assign: ${error.error}`);
      }
    } catch (error) {
      console.error("Error assigning team members:", error);
      alert("Failed to assign team members");
    }
  };

  const handleUpdate = async () => {
    if (!selectedRequest || !updateText) return;

    try {
      const response = await fetch(
        `/api/admin/prayer-requests/${selectedRequest.id}/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            update_text: updateText,
            status: updateStatus || undefined,
          }),
        }
      );

      if (response.ok) {
        await fetchRequests();
        setIsUpdateDialogOpen(false);
        setUpdateText("");
        setUpdateStatus("");
      } else {
        const error = await response.json();
        alert(`Failed to update: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating update:", error);
      alert("Failed to create update");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-slate-500/20 text-slate-300 border-slate-500/50",
      in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      answered: "bg-green-500/20 text-green-300 border-green-500/50",
      closed: "bg-gray-500/20 text-gray-300 border-gray-500/50",
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      normal: "bg-green-500/20 text-green-300 border-green-500/50",
      high: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      urgent: "bg-red-500/20 text-red-300 border-red-500/50",
    };
    return colors[priority] || colors.normal;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Header with Filters */}
      <Card className="min-w-0 bg-slate-900/40 border-slate-700/50">
        <CardHeader className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="min-w-0 flex items-center gap-2 text-white">
              <Heart className="h-5 w-5 shrink-0" />
              <span className="truncate">Prayer Requests Management</span>
            </CardTitle>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-h-[44px] w-full bg-slate-800/50 border-slate-700/50 text-white sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="min-h-[44px] w-full bg-slate-800/50 border-slate-700/50 text-white sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="min-w-0 bg-slate-900/40 border-slate-700/50">
          <CardContent className="min-w-0 pt-6">
            <div className="py-12 text-center">
              <Heart className="mx-auto mb-4 h-12 w-12 text-slate-500" />
              <p className="text-slate-400">No prayer requests found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="min-w-0 space-y-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="min-w-0 bg-slate-900/40 border-slate-700/50"
            >
              <CardHeader className="min-w-0">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex min-w-0 items-center gap-2 text-white">
                      <span className="truncate">{request.title}</span>
                    </CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={`shrink-0 ${getStatusColor(request.status)}`}>
                        {request.status.replace("_", " ")}
                      </Badge>
                      <Badge className={`shrink-0 ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </Badge>
                      {request.is_anonymous && (
                        <Badge className="shrink-0 bg-purple-500/20 text-purple-300 border-purple-500/50">
                          Anonymous
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-0 shrink-0 flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setSelectedTeamMembers(
                          request.team_assignments?.map((ta) => ta.team_member.id) || []
                        );
                        setIsAssignDialogOpen(true);
                      }}
                      className="min-h-[44px] shrink-0 border-slate-700 sm:w-auto"
                    >
                      <Users className="mr-2 h-4 w-4 shrink-0" />
                      Assign
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setUpdateStatus(request.status);
                        setIsUpdateDialogOpen(true);
                      }}
                      className="min-h-[44px] shrink-0 border-slate-700 sm:w-auto"
                    >
                      <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                      Update
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-w-0">
                <p className="mb-4 whitespace-pre-wrap break-words text-slate-300">
                  {request.request}
                </p>
                <div className="flex min-w-0 flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
                    <span className="shrink-0">
                      From: {request.is_anonymous ? "Anonymous" : (request.member?.full_name || request.member?.email || "Unknown")}
                    </span>
                    {request.assigned_to_profile && (
                      <span className="shrink-0">
                        Assigned to: {request.assigned_to_profile.full_name || request.assigned_to_profile.email}
                      </span>
                    )}
                    {request.team_assignments && request.team_assignments.length > 0 && (
                      <span className="shrink-0">
                        Team: {request.team_assignments.length} member(s)
                      </span>
                    )}
                  </div>
                  <span className="shrink-0">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Prayer Team</DialogTitle>
            <DialogDescription className="text-slate-400">
              Select team members to assign to this prayer request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Team Members</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={member.id}
                      checked={selectedTeamMembers.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeamMembers([...selectedTeamMembers, member.id]);
                        } else {
                          setSelectedTeamMembers(
                            selectedTeamMembers.filter((id) => id !== member.id)
                          );
                        }
                      }}
                      className="rounded border-slate-700"
                    />
                    <Label
                      htmlFor={member.id}
                      className="text-slate-300 cursor-pointer"
                    >
                      {member.full_name || member.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
                className="border-slate-700"
              >
                Cancel
              </Button>
              <Button onClick={handleAssign} className="bg-blue-600 hover:bg-blue-700">
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Update</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add an update or response to this prayer request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Update Text</Label>
              <Textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white"
                placeholder="Share an update or response..."
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Update Status (Optional)</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep Current Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUpdateDialogOpen(false);
                  setUpdateText("");
                  setUpdateStatus("");
                }}
                className="border-slate-700"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
                Add Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

