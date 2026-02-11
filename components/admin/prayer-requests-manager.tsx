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
import { Loader2, Heart, Users, MessageSquare, Filter } from "lucide-react";
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

  useEffect(() => {
    fetchRequests();
    fetchTeamMembers();
  }, [statusFilter, priorityFilter]);

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
        .in("role", ["admin", "pastor", "elder", "deacon", "leader"])
        .order("full_name");

      if (data) {
        setTeamMembers(data);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

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
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Prayer Requests Management
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700/50 text-white">
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
                <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700/50 text-white">
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
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No prayer requests found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="bg-slate-900/40 border-slate-700/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white flex items-center gap-2">
                      {request.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                      {request.is_anonymous && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                          Anonymous
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                      className="border-slate-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
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
                      className="border-slate-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap mb-4">
                  {request.request}
                </p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>
                      From: {request.is_anonymous ? "Anonymous" : (request.member?.full_name || request.member?.email || "Unknown")}
                    </span>
                    {request.assigned_to_profile && (
                      <span>
                        Assigned to: {request.assigned_to_profile.full_name || request.assigned_to_profile.email}
                      </span>
                    )}
                    {request.team_assignments && request.team_assignments.length > 0 && (
                      <span>
                        Team: {request.team_assignments.length} member(s)
                      </span>
                    )}
                  </div>
                  <span>
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

