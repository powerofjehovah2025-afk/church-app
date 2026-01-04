"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Newcomer, NewcomerUpdate } from "@/types/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Loader2,
  Phone,
  MessageCircle,
  Mail,
  CheckCircle2,
  User,
  Clock,
} from "lucide-react";

// Generate WhatsApp URL with personalized message from worker
const generateWhatsAppUrl = (phone: string | null, newcomerName: string, workerName: string) => {
  if (!phone) return "";
  
  // Extract first name from full name
  const firstName = newcomerName.split(" ")[0] || newcomerName;
  
  // Personalized message with worker name
  const message = `Hi ${firstName}, I'm ${workerName} from POJ Essex. It was great having you! How can I pray for you?`;
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate WhatsApp URL
  const phoneNumber = phone.replace(/\D/g, ""); // Remove non-digits
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};

export function MyFollowups() {
  const [followups, setFollowups] = useState<Newcomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNewcomer, setSelectedNewcomer] = useState<Newcomer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [contactNotes, setContactNotes] = useState("");
  const [isMarkingContacted, setIsMarkingContacted] = useState(false);
  const [workerName, setWorkerName] = useState("");

  const fetchFollowups = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("newcomers")
        .select("*")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching follow-ups:", error);
        return;
      }

      if (data) {
        setFollowups(data as Newcomer[]);
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch worker name on mount
  useEffect(() => {
    const fetchWorkerName = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile?.full_name) {
          setWorkerName(profile.full_name);
        } else {
          // Fallback to email username if no full name
          const emailUsername = user.email?.split("@")[0] || "Team Member";
          setWorkerName(emailUsername);
        }
      }
    };
    fetchWorkerName();
  }, []);

  useEffect(() => {
    fetchFollowups();

    // Set up real-time subscription
    let channel: ReturnType<typeof createClient>["channel"] | null = null;
    let isMounted = true;

    const setupRealtime = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;

      channel = supabase
        .channel(`my-followups-realtime-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "newcomers",
            filter: `assigned_to=eq.${user.id}`,
          },
          (payload) => {
            console.log("Real-time update:", payload);
            if (isMounted) {
              fetchFollowups();
            }
          }
        )
        .subscribe();

      console.log("Real-time subscription set up for follow-ups");
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [fetchFollowups]);

  const handleMarkContacted = async () => {
    if (!selectedNewcomer) return;

    setIsMarkingContacted(true);
    try {
      const supabase = createClient();
      const updateData: NewcomerUpdate = {
        contacted: true,
        contacted_at: new Date().toISOString(),
        contact_notes: contactNotes || null,
        status: "Contacted", // Auto-move to Contacted status
      };

      const { error } = await supabase
        .from("newcomers")
        .update(updateData)
        .eq("id", selectedNewcomer.id);

      if (error) {
        console.error("Error marking as contacted:", error);
        alert("Failed to mark as contacted. Please try again.");
        return;
      }

      // Update local state
      setFollowups((prev) =>
        prev.map((item) =>
          item.id === selectedNewcomer.id
            ? {
                ...item,
                contacted: true,
                contacted_at: new Date().toISOString(),
                contact_notes: contactNotes || null,
                status: "Contacted", // Update status locally too
              }
            : item
        )
      );

      setIsSheetOpen(false);
      setSelectedNewcomer(null);
      setContactNotes("");
    } catch (error) {
      console.error("Error marking as contacted:", error);
      alert("Failed to mark as contacted. Please try again.");
    } finally {
      setIsMarkingContacted(false);
    }
  };

  const handleNewcomerClick = (newcomer: Newcomer) => {
    setSelectedNewcomer(newcomer);
    setContactNotes(newcomer.contact_notes || "");
    setIsSheetOpen(true);
  };

  const uncontactedCount = followups.filter((f) => !f.contacted).length;
  const contactedCount = followups.filter((f) => f.contacted).length;

  if (isLoading) {
    return (
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">My Follow-ups</CardTitle>
              <CardDescription className="text-slate-400">
                Newcomers assigned to you for follow-up
              </CardDescription>
            </div>
            {uncontactedCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                {uncontactedCount} Pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {followups.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No follow-ups assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followups.map((newcomer) => (
                <div
                  key={newcomer.id}
                  onClick={() => handleNewcomerClick(newcomer)}
                  className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white text-sm">
                          {newcomer.full_name}
                        </h3>
                        {newcomer.contacted && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]">
                            Contacted ✓
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        {newcomer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{newcomer.email}</span>
                          </div>
                        )}
                        {newcomer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{newcomer.phone}</span>
                          </div>
                        )}
                        {newcomer.contacted_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Contacted {new Date(newcomer.contacted_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!newcomer.contacted && (
                      <div className="flex gap-2">
                        {newcomer.phone && workerName && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                generateWhatsAppUrl(newcomer.phone, newcomer.full_name, workerName),
                                "_blank"
                              );
                            }}
                            className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNewcomerClick(newcomer);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Contacted
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Details Sheet */}
      {selectedNewcomer && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
            <SheetHeader>
              <SheetTitle className="text-white">{selectedNewcomer.full_name}</SheetTitle>
              <SheetDescription className="text-slate-400">
                {selectedNewcomer.contacted
                  ? "Contact details and notes"
                  : "Mark this newcomer as contacted"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <p className="text-white">{selectedNewcomer.email || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Phone</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-white">{selectedNewcomer.phone || "Not provided"}</p>
                    {selectedNewcomer.phone && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `tel:${selectedNewcomer.phone}`;
                          }}
                          className="bg-slate-800/50 border-slate-700/50"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (workerName && selectedNewcomer.phone) {
                              window.open(
                                generateWhatsAppUrl(selectedNewcomer.phone, selectedNewcomer.full_name, workerName),
                                "_blank"
                              );
                            } else {
                              window.open(
                                `https://wa.me/${selectedNewcomer.phone?.replace(/\D/g, "")}`,
                                "_blank"
                              );
                            }
                          }}
                          className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Notes */}
              <div className="space-y-2">
                <Label htmlFor="contact-notes" className="text-slate-300">
                  Contact Notes {selectedNewcomer.contacted && "(Already Contacted)"}
                </Label>
                <Textarea
                  id="contact-notes"
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Add notes about your contact with this newcomer..."
                  className="bg-slate-800/50 border-slate-700/50 text-white min-h-[120px]"
                  disabled={selectedNewcomer.contacted}
                />
                {selectedNewcomer.contacted_at && (
                  <p className="text-xs text-slate-400">
                    Contacted on: {new Date(selectedNewcomer.contacted_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Mark as Contacted Button */}
              {!selectedNewcomer.contacted && (
                <Button
                  onClick={handleMarkContacted}
                  disabled={isMarkingContacted}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isMarkingContacted ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marking as Contacted...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Contacted
                    </>
                  )}
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

