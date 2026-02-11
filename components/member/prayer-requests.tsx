"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Heart, Clock, CheckCircle, X } from "lucide-react";

interface PrayerRequest {
  id: string;
  title: string;
  request: string;
  status: string;
  priority: string;
  is_anonymous: boolean;
  assigned_to: string | null;
  assigned_to_profile?: { id: string; full_name: string | null; email: string | null } | null;
  created_at: string;
  updated_at: string;
  answered_at?: string | null;
}

export function PrayerRequests() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    request: "",
    priority: "normal",
    is_anonymous: false,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/member/prayer-requests");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/member/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchRequests();
        setIsDialogOpen(false);
        setFormData({
          title: "",
          request: "",
          priority: "normal",
          is_anonymous: false,
        });
      } else {
        const error = await response.json();
        alert(`Failed to submit prayer request: ${error.error}`);
      }
    } catch (error) {
      console.error("Error submitting prayer request:", error);
      alert("Failed to submit prayer request");
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "answered":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="h-6 w-6" />
            Prayer Requests
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Submit prayer requests and track their status
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Submit Prayer Request</DialogTitle>
              <DialogDescription className="text-slate-400">
                Share your prayer request with the prayer team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  placeholder="Brief title for your request"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Prayer Request</Label>
                <Textarea
                  value={formData.request}
                  onChange={(e) =>
                    setFormData({ ...formData, request: e.target.value })
                  }
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  placeholder="Share your prayer request details..."
                  rows={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.is_anonymous}
                  onChange={(e) =>
                    setFormData({ ...formData, is_anonymous: e.target.checked })
                  }
                  className="rounded border-slate-700"
                />
                <Label htmlFor="anonymous" className="text-slate-300">
                  Submit anonymously
                </Label>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-slate-700"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No prayer requests yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Submit your first prayer request to get started
              </p>
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
                      {getStatusIcon(request.status)}
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
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap mb-4">
                  {request.request}
                </p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </span>
                    {request.assigned_to_profile && (
                      <span>
                        Assigned to: {request.assigned_to_profile.full_name || request.assigned_to_profile.email}
                      </span>
                    )}
                  </div>
                  {request.answered_at && (
                    <span>
                      Answered: {new Date(request.answered_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

