"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Loader2, Calendar, MapPin, Clock, Users, CheckCircle, X, HelpCircle } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  max_attendees: number | null;
  requires_rsvp: boolean;
  user_rsvp: {
    status: string;
    notes: string | null;
    rsvp_at: string;
  } | null;
}

export function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRsvpDialogOpen, setIsRsvpDialogOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string>("confirmed");
  const [rsvpNotes, setRsvpNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/member/events?upcoming=true");
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

  const handleRsvp = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/member/events/${selectedEvent.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: rsvpStatus,
          notes: rsvpNotes || null,
        }),
      });

      if (response.ok) {
        await fetchEvents();
        setIsRsvpDialogOpen(false);
        setRsvpNotes("");
        setRsvpStatus("confirmed");
      } else {
        const error = await response.json();
        alert(`Failed to RSVP: ${error.error}`);
      }
    } catch (error) {
      console.error("Error submitting RSVP:", error);
      alert("Failed to submit RSVP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRsvp = async (eventId: string) => {
    if (!confirm("Are you sure you want to cancel your RSVP?")) {
      return;
    }

    try {
      const response = await fetch(`/api/member/events/${eventId}/rsvp`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEvents();
      } else {
        alert("Failed to cancel RSVP");
      }
    } catch (error) {
      console.error("Error canceling RSVP:", error);
      alert("Failed to cancel RSVP");
    }
  };

  const getRsvpStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-green-500/20 text-green-300 border-green-500/50",
      declined: "bg-red-500/20 text-red-300 border-red-500/50",
      maybe: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      pending: "bg-slate-500/20 text-slate-300 border-slate-500/50",
    };
    return colors[status] || colors.pending;
  };

  const getRsvpStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "declined":
        return <X className="h-4 w-4" />;
      case "maybe":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return null;
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
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Upcoming Events
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          View and RSVP to upcoming church events
        </p>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No upcoming events</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="bg-slate-900/40 border-slate-700/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white">{event.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      {event.start_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.start_time}
                          {event.end_time && ` - ${event.end_time}`}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                      {event.max_attendees && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Max: {event.max_attendees}
                        </div>
                      )}
                    </div>
                  </div>
                  {event.user_rsvp && (
                    <Badge className={getRsvpStatusColor(event.user_rsvp.status)}>
                      {getRsvpStatusIcon(event.user_rsvp.status)}
                      <span className="ml-1">{event.user_rsvp.status}</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {event.description && (
                  <p className="text-slate-300 whitespace-pre-wrap mb-4">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {event.requires_rsvp ? (
                    <div className="flex gap-2">
                      {event.user_rsvp ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              setRsvpStatus(event.user_rsvp!.status);
                              setRsvpNotes(event.user_rsvp!.notes || "");
                              setIsRsvpDialogOpen(true);
                            }}
                            className="border-slate-700"
                          >
                            Update RSVP
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelRsvp(event.id)}
                            className="border-red-700 text-red-400"
                          >
                            Cancel RSVP
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedEvent(event);
                            setRsvpStatus("confirmed");
                            setRsvpNotes("");
                            setIsRsvpDialogOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          RSVP
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/50">
                      No RSVP Required
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* RSVP Dialog */}
      <Dialog open={isRsvpDialogOpen} onOpenChange={setIsRsvpDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              RSVP to {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedEvent?.event_date && (
                <>
                  {new Date(selectedEvent.event_date).toLocaleDateString()}
                  {selectedEvent.start_time && ` at ${selectedEvent.start_time}`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">RSVP Status</Label>
              <Select value={rsvpStatus} onValueChange={setRsvpStatus}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">I&apos;ll be there</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                  <SelectItem value="declined">Can&apos;t make it</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Notes (Optional)</Label>
              <Textarea
                value={rsvpNotes}
                onChange={(e) => setRsvpNotes(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white"
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsRsvpDialogOpen(false)}
                className="border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRsvp}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit RSVP"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

