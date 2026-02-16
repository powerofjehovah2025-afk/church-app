"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Calendar, MapPin, Clock, Users, Edit, Trash2, Eye } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  max_attendees: number | null;
  is_active: boolean;
  requires_rsvp: boolean;
  created_by: string | null;
  created_at: string;
  rsvp_count?: Array<{ count: number }>;
}

interface EventRsvp {
  id: string;
  status: string;
  notes: string | null;
  rsvp_at: string;
  member: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    max_attendees: "",
    is_active: true,
    requires_rsvp: false,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventRsvps = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setRsvps(data.event.rsvps || []);
      }
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedEvent
        ? `/api/admin/events/${selectedEvent.id}`
        : "/api/admin/events";
      const method = selectedEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          max_attendees: formData.max_attendees
            ? parseInt(formData.max_attendees, 10)
            : null,
        }),
      });

      if (response.ok) {
        await fetchEvents();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Failed to ${selectedEvent ? "update" : "create"} event: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert(`Failed to ${selectedEvent ? "update" : "create"} event`);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const handleViewRsvps = async (event: Event) => {
    setSelectedEvent(event);
    await fetchEventRsvps(event.id);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      location: event.location || "",
      max_attendees: event.max_attendees?.toString() || "",
      is_active: event.is_active,
      requires_rsvp: event.requires_rsvp,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedEvent(null);
    setFormData({
      title: "",
      description: "",
      event_date: "",
      start_time: "",
      end_time: "",
      location: "",
      max_attendees: "",
      is_active: true,
      requires_rsvp: false,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-green-500/20 text-green-300 border-green-500/50",
      declined: "bg-red-500/20 text-red-300 border-red-500/50",
      maybe: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
    };
    return colors[status] || "bg-slate-500/20 text-slate-300 border-slate-500/50";
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
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex min-w-0 items-center gap-2 text-2xl font-bold text-white sm:text-4xl">
            <Calendar className="h-6 w-6 shrink-0" />
            <span className="truncate">Events Management</span>
          </h2>
          <p className="mt-1 text-sm text-pretty break-words text-slate-400">
            Create and manage church events
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="min-h-[44px] w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-slate-800/50 border-slate-700/50 text-white"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Event Date *</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">End Time</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Attendees</Label>
                  <Input
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) =>
                      setFormData({ ...formData, max_attendees: e.target.value })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-white"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_rsvp"
                    checked={formData.requires_rsvp}
                    onChange={(e) =>
                      setFormData({ ...formData, requires_rsvp: e.target.checked })
                    }
                    className="rounded border-slate-700"
                  />
                  <Label htmlFor="requires_rsvp" className="text-slate-300">
                    Requires RSVP
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded border-slate-700"
                  />
                  <Label htmlFor="is_active" className="text-slate-300">
                    Active
                  </Label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="border-slate-700"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {selectedEvent ? "Update" : "Create"} Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="min-w-0 bg-slate-900/40 border-slate-700/50">
          <CardContent className="min-w-0 pt-6">
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-500" />
              <p className="text-slate-400">No events created yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="min-w-0 space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="min-w-0 bg-slate-900/40 border-slate-700/50">
              <CardHeader className="min-w-0">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex min-w-0 flex-wrap items-center gap-2 text-white">
                      <span className="truncate">{event.title}</span>
                      {!event.is_active && (
                        <Badge className="shrink-0 bg-gray-500/20 text-gray-300 border-gray-500/50">
                          Inactive
                        </Badge>
                      )}
                      {event.requires_rsvp && (
                        <Badge className="shrink-0 bg-blue-500/20 text-blue-300 border-blue-500/50">
                          RSVP Required
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400 sm:gap-4">
                      <div className="flex shrink-0 items-center gap-1">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      {event.start_time && (
                        <div className="flex shrink-0 items-center gap-1">
                          <Clock className="h-4 w-4 shrink-0" />
                          {event.start_time}
                          {event.end_time && ` - ${event.end_time}`}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex shrink-0 items-center gap-1">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      {event.max_attendees && (
                        <div className="flex shrink-0 items-center gap-1">
                          <Users className="h-4 w-4 shrink-0" />
                          Max: {event.max_attendees}
                        </div>
                      )}
                      {event.requires_rsvp && (
                        <div className="flex shrink-0 items-center gap-1">
                          <Users className="h-4 w-4 shrink-0" />
                          RSVPs: {event.rsvp_count?.[0]?.count || 0}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-0 shrink-0 flex-row flex-wrap gap-2">
                    {event.requires_rsvp && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRsvps(event)}
                        className="min-h-[44px] shrink-0 border-slate-700 sm:w-auto"
                      >
                        <Eye className="mr-2 h-4 w-4 shrink-0" />
                        View RSVPs
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(event)}
                      className="min-h-[44px] shrink-0 border-slate-700 sm:w-auto"
                    >
                      <Edit className="mr-2 h-4 w-4 shrink-0" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="min-h-[44px] shrink-0 border-red-700 text-red-400 sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {event.description && (
                <CardContent className="min-w-0">
                  <p className="whitespace-pre-wrap break-words text-slate-300">
                    {event.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* RSVPs View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="min-w-0 max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader className="min-w-0">
            <DialogTitle className="min-w-0 break-words text-white">
              RSVPs for {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="min-w-0 break-words text-slate-400">
              {selectedEvent?.event_date && (
                <>
                  {new Date(selectedEvent.event_date).toLocaleDateString()}
                  {selectedEvent.start_time && ` at ${selectedEvent.start_time}`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {rsvps.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No RSVPs yet</p>
          ) : (
            <div className="min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-300">Member</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Notes</TableHead>
                    <TableHead className="text-slate-300">RSVP Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rsvps.map((rsvp) => (
                    <TableRow key={rsvp.id}>
                      <TableCell className="min-w-0 break-words text-slate-300">
                        {rsvp.member.full_name || rsvp.member.email || "Unknown"}
                        {rsvp.member.phone && (
                          <div className="text-xs text-slate-500">
                            {rsvp.member.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rsvp.status)}>
                          {rsvp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-0 break-words text-slate-300">
                        {rsvp.notes || "-"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(rsvp.rsvp_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

