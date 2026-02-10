"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pin, Trash2, Edit, X } from "lucide-react";
import type { Announcement } from "@/types/database.types";

export function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [targetAudience, setTargetAudience] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [targetAudience]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (targetAudience !== "all") {
        params.append("target_audience", targetAudience);
      }
      params.append("include_expired", "false");

      const response = await fetch(`/api/admin/announcements?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      } else {
        console.error("Failed to fetch announcements");
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingAnnouncement(null);
    setTitle("");
    setContent("");
    setSelectedAudience("all");
    setIsPinned(false);
    setExpiresAt("");
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setSelectedAudience(announcement.target_audience);
    setIsPinned(announcement.is_pinned);
    setExpiresAt(announcement.expires_at ? announcement.expires_at.split("T")[0] : "");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingAnnouncement
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : "/api/admin/announcements";
      const method = editingAnnouncement ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        target_audience: selectedAudience,
        is_pinned: isPinned,
      };

      if (expiresAt) {
        body.expires_at = new Date(expiresAt).toISOString();
      } else {
        body.expires_at = null;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        await fetchAnnouncements();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save announcement");
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAnnouncements();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete announcement");
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement");
    }
  };

  const getAudienceColor = (audience: string) => {
    const colors: Record<string, string> = {
      all: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      admin: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      pastor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
      elder: "bg-teal-500/20 text-teal-300 border-teal-500/50",
      deacon: "bg-green-500/20 text-green-300 border-green-500/50",
      leader: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      member: "bg-slate-500/20 text-slate-300 border-slate-500/50",
    };
    return colors[audience] || colors.all;
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
      {/* Header with Create Button */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Announcements</CardTitle>
              <CardDescription className="text-slate-400">
                {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                  <SelectItem value="elder">Elder</SelectItem>
                  <SelectItem value="deacon">Deacon</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleOpenCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-slate-400">No announcements found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`bg-slate-900/40 border-slate-700/50 ${
                announcement.is_pinned ? "border-yellow-500/50 bg-yellow-500/5" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      )}
                      <h3 className="text-white font-semibold text-lg">{announcement.title}</h3>
                      <Badge className={getAudienceColor(announcement.target_audience)}>
                        {announcement.target_audience}
                      </Badge>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap mb-3">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        By: {(announcement as any).creator?.full_name || (announcement as any).creator?.email || "Unknown"}
                      </span>
                      <span>
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                      {announcement.expires_at && (
                        <span>
                          Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDialog(announcement)}
                      className="border-slate-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      className="border-red-700 text-red-400 hover:bg-red-500/20"
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingAnnouncement
                ? "Update the announcement details"
                : "Create a new announcement for members"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
                className="bg-slate-800/50 border-slate-700/50 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Announcement content"
                className="bg-slate-800/50 border-slate-700/50 text-white"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Target Audience</Label>
                <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="pastor">Pastor</SelectItem>
                    <SelectItem value="elder">Elder</SelectItem>
                    <SelectItem value="deacon">Deacon</SelectItem>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Expires At (Optional)</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-700"
              />
              <Label htmlFor="isPinned" className="text-slate-300 cursor-pointer">
                Pin this announcement (show at top)
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !title.trim() || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

