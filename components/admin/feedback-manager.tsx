"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle, MessageSquare, Star } from "lucide-react";
import type { Feedback } from "@/types/database.types";

interface FeedbackWithUser extends Feedback {
  submitter?: { id: string; full_name: string | null; email: string | null };
  reviewer?: { id: string; full_name: string | null; email: string | null };
}

export function FeedbackManager() {
  const [feedback, setFeedback] = useState<FeedbackWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [status, setStatus] = useState<string>("pending");

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("feedback_type", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || `Failed to load feedback (${response.status})`,
        });
        return;
      }

      const data = await response.json();
      setFeedback(data.feedback || []);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      setMessage({
        type: "error",
        text: `Failed to load feedback: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleOpenDialog = (item: FeedbackWithUser) => {
    setSelectedFeedback(item);
    setAdminNotes(item.admin_notes || "");
    setStatus(item.status);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedFeedback(null);
    setAdminNotes("");
    setStatus("pending");
  };

  const handleUpdate = async () => {
    if (!selectedFeedback) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/feedback/${selectedFeedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update feedback");
      }

      setMessage({
        type: "success",
        text: "Feedback updated successfully!",
      });

      handleCloseDialog();
      fetchFeedback();
    } catch (error) {
      console.error("Error updating feedback:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update feedback",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "reviewed":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "resolved":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "archived":
        return "bg-slate-500/20 text-slate-300 border-slate-500/50";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "service":
        return "Service";
      case "event":
        return "Event";
      case "general":
        return "General";
      default:
        return type;
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white">Feedback Management</CardTitle>
              <CardDescription className="text-slate-400">
                Review and manage member feedback
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No feedback found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <Card
                  key={item.id}
                  className="border-slate-800 bg-slate-800/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
                  onClick={() => handleOpenDialog(item)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge variant="outline" className="border-slate-600 text-slate-400">
                            {getTypeLabel(item.feedback_type)}
                          </Badge>
                          {item.rating && (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star className="h-3 w-3 fill-yellow-400" />
                              <span className="text-xs">{item.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-2 line-clamp-2">{item.content}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>
                            By: {item.is_anonymous ? "Anonymous" : item.submitter?.full_name || item.submitter?.email || "Unknown"}
                          </span>
                          <span>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFeedback?.title}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review and update feedback status
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Content</Label>
                <p className="mt-1 text-sm text-slate-400 whitespace-pre-wrap">
                  {selectedFeedback.content}
                </p>
              </div>

              {selectedFeedback.rating && (
                <div>
                  <Label className="text-slate-300">Rating</Label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= selectedFeedback.rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-slate-300">Submitted By</Label>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedFeedback.is_anonymous
                    ? "Anonymous"
                    : selectedFeedback.submitter?.full_name || selectedFeedback.submitter?.email || "Unknown"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-300">
                  Status *
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotes" className="text-slate-300">
                  Admin Notes
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this feedback..."
                  rows={4}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
            </div>
          )}

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
              type="button"
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

