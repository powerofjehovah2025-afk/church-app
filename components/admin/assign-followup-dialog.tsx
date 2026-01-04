"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database.types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, User } from "lucide-react";

interface AssignFollowupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (userId: string) => void;
  newcomerName: string;
  currentAssigneeId?: string | null;
}

export function AssignFollowupDialog({
  open,
  onOpenChange,
  onAssign,
  newcomerName,
  currentAssigneeId,
}: AssignFollowupDialogProps) {
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fetch team members on mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setIsFetching(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("role", "member")
          .order("full_name", { ascending: true });

        if (error) {
          console.error("Error fetching team members:", error);
          return;
        }

        if (data) {
          setTeamMembers(data as Profile[]);
          setFilteredMembers(data as Profile[]);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      } finally {
        setIsFetching(false);
      }
    };

    if (open) {
      fetchTeamMembers();
      setSearchQuery("");
      setSelectedUserId(currentAssigneeId || null);
    }
  }, [open, currentAssigneeId]);

  // Filter team members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(teamMembers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = teamMembers.filter(
      (member) =>
        member.full_name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
    );
    setFilteredMembers(filtered);
  }, [searchQuery, teamMembers]);

  const handleAssign = async () => {
    if (!selectedUserId) return;

    setIsLoading(true);
    try {
      onAssign(selectedUserId);
      onOpenChange(false);
      setSelectedUserId(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error assigning follow-up:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
        <SheetHeader>
          <SheetTitle className="text-white">Assign Follow-up</SheetTitle>
          <SheetDescription className="text-slate-400">
            Select a team member to follow up with {newcomerName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-slate-300">
              Search Team Members
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Team Members List */}
          <div className="space-y-2">
            <Label className="text-slate-300">Select Team Member</Label>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {isFetching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  {searchQuery
                    ? "No team members found matching your search"
                    : "No team members available"}
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedUserId(member.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedUserId === member.id
                        ? "bg-blue-500/20 border-blue-500/50 text-white"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.full_name || "Unnamed Member"}
                        </p>
                        <p className="text-sm text-slate-400 truncate">
                          {member.email}
                        </p>
                      </div>
                      {selectedUserId === member.id && (
                        <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


