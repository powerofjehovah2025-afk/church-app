"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Mail, Send, CheckCircle2, AlertCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database.types";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  recipient?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export function Messaging() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterRecipient, setFilterRecipient] = useState<string>("all");

  // Form state
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching members:", error);
        return;
      }

      setMembers((data as Profile[]) || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filterRecipient === "all"
        ? "/api/admin/messages"
        : `/api/admin/messages?recipient_id=${filterRecipient}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load messages");
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load messages",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterRecipient]);

  useEffect(() => {
    fetchMembers();
    fetchMessages();
  }, [fetchMembers, fetchMessages]);

  const handleOpenDialog = () => {
    setRecipientId("");
    setSubject("");
    setBody("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setRecipientId("");
    setSubject("");
    setBody("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to send messages");
      }

      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_id: user.id,
          recipient_id: recipientId,
          subject,
          body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setMessage({
        type: "success",
        text: "Message sent successfully!",
      });

      handleCloseDialog();
      await fetchMessages();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send message",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }

      await fetchMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
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

      {/* Messages List */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-white">Messaging</CardTitle>
              <CardDescription className="text-slate-400">
                Send messages to members
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={filterRecipient} onValueChange={setFilterRecipient}>
                <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue placeholder="Filter by recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleOpenDialog}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Send New Message</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Send a message to a member
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient" className="text-white">
                          Recipient *
                        </Label>
                        <Select value={recipientId} onValueChange={setRecipientId} required>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.full_name || member.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-white">
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Message subject..."
                          className="bg-slate-800 border-slate-700 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="body" className="text-white">
                          Message *
                        </Label>
                        <Textarea
                          id="body"
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="Type your message..."
                          className="bg-slate-800 border-slate-700 text-white"
                          rows={6}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        className="border-slate-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No messages found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg border ${
                    msg.is_read
                      ? "bg-slate-800/30 border-slate-700/30"
                      : "bg-slate-800/50 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-white font-medium">{msg.subject}</h3>
                        {!msg.is_read && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/50">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-2 whitespace-pre-wrap">{msg.body}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            To: {msg.recipient?.full_name || msg.recipient?.email || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>
                            From: {msg.sender?.full_name || msg.sender?.email || "Unknown"}
                          </span>
                        </div>
                        <span>
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!msg.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(msg.id)}
                        className="border-slate-700"
                      >
                        Mark as Read
                      </Button>
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

