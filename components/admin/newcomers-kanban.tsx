"use client";

import { useState, useMemo, useEffect, useRef, useCallback, startTransition } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import type { Newcomer, NewcomerUpdate, Profile } from "@/types/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Search,
  Phone,
  MessageCircle,
  Users,
  AlertCircle,
  Loader2,
  Mail,
  User,
  Plus,
  TrendingUp,
  CheckCircle2,
  Wifi,
  WifiOff,
  Undo2,
  Bus,
  UserPlus,
  Trash2,
} from "lucide-react";
import { AssignFollowupDialog } from "./assign-followup-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewcomersKanbanProps {
  initialData: Newcomer[];
}

interface ActivityLog {
  id: string;
  message: string;
  timestamp: Date;
}

// Staff members will be loaded from profiles table

// Column configuration - Ministry Growth Center
const COLUMNS = [
  {
    id: "new-arrivals",
    title: "New Arrivals",
    statuses: ["New", "First Timer"],
    color: "border-blue-500/20 bg-blue-500/5",
    glow: "",
  },
  {
    id: "contacted",
    title: "Contacted",
    statuses: ["Contacted"],
    color: "border-purple-500/20 bg-purple-500/5",
    glow: "",
  },
  {
    id: "engaged",
    title: "Engaged",
    statuses: ["Engaged", "Follow-up Pending"],
    color: "border-yellow-500/20 bg-yellow-500/5",
    glow: "",
  },
  {
    id: "member",
    title: "Member",
    statuses: ["Member"],
    color: "border-green-500/20 bg-green-500/5",
    glow: "ring-1 ring-[#22c55e]/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]", // Green glow for Member
  },
] as const;

const formatPhoneForLink = (phone: string | null) => {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
};

// Generate WhatsApp URL with pre-filled welcome message
const generateWhatsAppUrl = (phone: string | null, fullName: string) => {
  if (!phone) return "";
  
  // Extract first name from full name
  const firstName = fullName.split(" ")[0] || fullName;
  
  // Pre-filled welcome message
  const message = `Hi ${firstName}, it was a blessing having you at POJ Essex today! How can we pray for you this week?`;
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate WhatsApp URL
  const phoneNumber = formatPhoneForLink(phone);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};

const isOlderThan24Hours = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours > 24;
};

const isOlderThan48Hours = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours > 48;
};

const isOlderThan72Hours = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours > 72;
};

const getStatusForColumn = (columnId: string): string => {
  switch (columnId) {
    case "new-arrivals":
      return "New";
    case "contacted":
      return "Contacted";
    case "engaged":
      return "Engaged";
    case "member":
      return "Member";
    default:
      return "New";
  }
};

// Celebration confetti using canvas-confetti library
const triggerConfetti = () => {
  if (typeof window === "undefined") return;
  
  // Create a celebration burst from the center
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: NodeJS.Timeout = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Confetti from center
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
};

export function NewcomersKanban({ initialData }: NewcomersKanbanProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [newcomers, setNewcomers] = useState<Newcomer[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedNewcomer, setSelectedNewcomer] = useState<Newcomer | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [updatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedNewcomerRef = useRef<Newcomer | null>(null);

  // Get current user name for activity log
  const [currentUserName, setCurrentUserName] = useState("Admin");
  
  // Real-time subscription status tracking
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Undo state - track last drag operation
  const [lastDragOperation, setLastDragOperation] = useState<{
    newcomerId: string;
    fromStatus: string;
    toStatus: string;
    newcomerName: string;
  } | null>(null);

  // Assign follow-up dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newcomerToAssign, setNewcomerToAssign] = useState<Newcomer | null>(null);
  
  // Assignment filter state
  const [assignmentFilter] = useState<"all" | "unassigned" | "assigned" | "contacted">("all");
  
  // Staff members for assignment (loaded from profiles)
  const [staffMembers, setStaffMembers] = useState<Profile[]>([]);

  // Cache for parseNotes to avoid repeated parsing
  const parseNotesCache = useRef<Map<string, ReturnType<typeof parseNotes>>>(new Map());

  // Track when component has mounted on the client to prevent hydration mismatches
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fetch staff members for assignment
  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .in("role", ["admin", "member"])
          .order("full_name", { ascending: true });

        if (error) {
          console.error("Error fetching staff members:", error);
          return;
        }

        if (data) {
          setStaffMembers(data as Profile[]);
        }
      } catch (error) {
        console.error("Error fetching staff members:", error);
      }
    };

    fetchStaffMembers();
  }, []);

  // Debounce search input for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync initialData when it changes (e.g., from server-side fetch)
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      console.log(`Initial data received: ${initialData.length} newcomers`);
      setNewcomers(initialData);
    } else {
      console.log("Initial data is empty or undefined");
    }
  }, [initialData]);

  // Helper function to parse notes into structured data
  const parseNotes = (notes: string | null) => {
    if (!notes) return {};
    
    const parsed: {
      whatsapp?: string;
      transport?: string;
      countryOrigin?: string;
      bornAgain?: string;
      bornAgainDetails?: string;
      baptised?: string;
      baptisedWhen?: string;
      departments?: string[];
      sector?: string;
      profession?: string;
      hasChildren?: boolean;
      gender?: string;
      birthday?: string;
      weddingAnniversary?: string;
      town?: string;
      parish?: string;
      startDate?: string;
      joinWorkforce?: boolean;
      [key: string]: unknown;
    } = {};

    const parts = notes.split(" | ");
    parts.forEach(part => {
      if (part.includes("WhatsApp:")) {
        parsed.whatsapp = part.split("WhatsApp:")[1]?.trim();
      }
      if (part.includes("Transport:")) {
        parsed.transport = part.split("Transport:")[1]?.trim();
      }
      if (part.includes("Country of Origin:")) {
        parsed.countryOrigin = part.split("Country of Origin:")[1]?.trim();
      }
      if (part.includes("Born Again:")) {
        parsed.bornAgain = part.split("Born Again:")[1]?.trim();
      }
      if (part.includes("Born Again Details:")) {
        parsed.bornAgainDetails = part.split("Born Again Details:")[1]?.trim();
      }
      if (part.includes("Baptised:")) {
        parsed.baptised = part.split("Baptised:")[1]?.trim();
      }
      if (part.includes("Baptised When:")) {
        parsed.baptisedWhen = part.split("Baptised When:")[1]?.trim();
      }
      if (part.includes("Departments:")) {
        parsed.departments = part.split("Departments:")[1]?.trim().split(", ");
      }
      if (part.includes("Sector:")) {
        parsed.sector = part.split("Sector:")[1]?.trim();
      }
      if (part.includes("Profession:")) {
        parsed.profession = part.split("Profession:")[1]?.trim();
      }
      if (part.includes("Has Children: Yes")) {
        parsed.hasChildren = true;
      }
      if (part.includes("Gender:")) {
        parsed.gender = part.split("Gender:")[1]?.trim();
      }
      if (part.includes("Birthday:")) {
        parsed.birthday = part.split("Birthday:")[1]?.trim();
      }
      if (part.includes("Wedding Anniversary:")) {
        parsed.weddingAnniversary = part.split("Wedding Anniversary:")[1]?.trim();
      }
      if (part.includes("Town:")) {
        parsed.town = part.split("Town:")[1]?.trim();
      }
      if (part.includes("Parish:")) {
        parsed.parish = part.split("Parish:")[1]?.trim();
      }
      if (part.includes("Start Date:")) {
        parsed.startDate = part.split("Start Date:")[1]?.trim();
      }
      if (part.includes("Join Workforce: Yes")) {
        parsed.joinWorkforce = true;
      }
    });

    return parsed;
  };

  useEffect(() => {
    const getUserName = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserName(user.email.split("@")[0]);
      }
    };
    getUserName();
  }, []);

  // Fetch newcomers on mount and set up real-time subscription
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    // Fetch function for real-time updates
    const fetchNewcomers = async () => {
      try {
        console.log("🔄 Fetching newcomers from database...");
        const { data, error } = await supabase
          .from("newcomers")
          .select("*, followup_status, followup_notes, last_followup_at, followup_count, next_followup_date, assigned_at")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Error fetching newcomers:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          return;
        }

        if (data) {
          console.log(`✅ Fetched ${data.length} newcomers from database`);
          if (isMounted) {
            setNewcomers(data);
          }
        } else {
          console.log("⚠️ No data returned from query");
        }
      } catch (err) {
        console.error("❌ Error in fetchNewcomers:", err);
      }
    };

    // Unified handler for all postgres_changes events
    const handleRealtimeChange = (payload: { eventType: string; new?: unknown; old?: unknown }) => {
      if (!isMounted) return;

      console.log(`📡 Real-time event received: ${payload.eventType}`, payload);

      if (payload.eventType === 'INSERT') {
        const newRecord = payload.new as Newcomer;
        console.log('🆕 New row inserted:', newRecord);
        setNewcomers((prev) => {
          // Check if record already exists to avoid duplicates
          if (!prev.find((n) => n.id === newRecord.id)) {
            const updated = [newRecord, ...prev].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            console.log(`✅ Added new record. Total records: ${updated.length}`);
            return updated;
          }
          return prev;
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedRecord = payload.new as Newcomer;
        console.log('🔄 Row updated:', updatedRecord);
        setNewcomers((prev) =>
          prev.map((item) =>
            item.id === updatedRecord.id ? updatedRecord : item
          )
        );
        // Update selected newcomer if it's the one being updated
        if (selectedNewcomerRef.current?.id === updatedRecord.id) {
          setSelectedNewcomer(updatedRecord);
          setAdminNotes(updatedRecord.notes || "");
          selectedNewcomerRef.current = updatedRecord;
        }
      } else if (payload.eventType === 'DELETE') {
        const deletedRecordId = payload.old.id;
        console.log('🗑️ Row deleted:', deletedRecordId);
        setNewcomers((prev) => prev.filter((item) => item.id !== deletedRecordId));
        // Close sheet if the deleted record is currently selected
        if (selectedNewcomerRef.current?.id === deletedRecordId) {
          setIsSheetOpen(false);
          setSelectedNewcomer(null);
          selectedNewcomerRef.current = null;
        }
      }
    };

    // Set up real-time subscription with authentication check
    const setupRealtime = async () => {
      try {
        // Step 1: Check authentication
        console.log("🔐 Checking authentication status...");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("❌ Authentication error:", authError);
          console.warn("⚠️ User not authenticated, skipping real-time subscription");
          // Still fetch data, but don't subscribe
          await fetchNewcomers();
          return;
        }

        if (!user) {
          console.warn("⚠️ User not authenticated, skipping real-time subscription");
          // Still fetch data, but don't subscribe
          await fetchNewcomers();
          return;
        }

        console.log("✅ User authenticated:", user.email);

        // Step 2: Fetch initial data
        await fetchNewcomers();

        // Step 3: Set up real-time subscription (non-blocking)
        console.log("📡 Setting up real-time subscription...");
        
        try {
          // Create a unique channel name to avoid conflicts
          const channelName = `newcomers-realtime-${Date.now()}`;
          
          channel = supabase
            .channel(channelName)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'newcomers',
              },
              handleRealtimeChange
            )
            .subscribe(async (status, err) => {
              if (!isMounted) return;

              console.log(`📡 Subscription status changed: ${status}`, err || '');

              if (status === 'SUBSCRIBED') {
                console.log('✅ Successfully subscribed to newcomers real-time changes');
                setIsRealtimeConnected(true);
                
                // Test the subscription by checking if we can receive events
                console.log('🧪 Testing subscription...');
                // The subscription is working if we reach here
              } else if (status === 'CHANNEL_ERROR') {
                // Don't throw - just log and continue
                console.warn('⚠️ Real-time subscription error (non-critical)');
                if (err) {
                  console.warn('Error details:', err);
                }
                console.warn('💡 Real-time updates disabled. Data will still load, but you may need to refresh to see new entries.');
                console.warn('💡 To enable real-time:');
                console.warn('   1. Go to Supabase Dashboard → Database → Replication');
                console.warn('   2. Enable Realtime for "newcomers" table');
                console.warn('   3. Or run: ALTER PUBLICATION supabase_realtime ADD TABLE newcomers;');
                setIsRealtimeConnected(false);
              } else if (status === 'TIMED_OUT') {
                console.warn('⏱️ Real-time subscription timed out (non-critical)');
                console.warn('💡 This usually means the table is not in the Realtime publication');
                setIsRealtimeConnected(false);
              } else if (status === 'CLOSED') {
                console.warn('🔒 Real-time subscription closed (non-critical)');
                setIsRealtimeConnected(false);
              } else {
                console.log('📡 Real-time subscription status:', status);
                setIsRealtimeConnected(status === 'SUBSCRIBED');
              }
            });

          console.log("📡 Real-time subscription setup initiated with channel:", channelName);
          
          // Wait a moment to see if subscription succeeds
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check channel state
          if (channel && channel.state === 'joined') {
            console.log('✅ Channel successfully joined');
          } else if (channel) {
            console.warn('⚠️ Channel state:', channel.state);
          }
        } catch (realtimeError) {
          // Don't let real-time errors break the app
          console.warn('⚠️ Real-time subscription failed (non-critical):', realtimeError);
          console.warn('💡 App will continue to work, but real-time updates are disabled');
          setIsRealtimeConnected(false);
        }

      } catch (err) {
        console.error("❌ Error setting up real-time subscription:", err);
        setIsRealtimeConnected(false);
        // Still try to fetch data even if subscription fails
        await fetchNewcomers();
      }
    };

    // Initialize
    setupRealtime();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      isMounted = false;
      setIsRealtimeConnected(false);
      if (channel) {
        supabase.removeChannel(channel);
        console.log('✅ Real-time subscription cleaned up');
      }
    };
  }, []); // Empty dependency array - subscription should only be set up once

  // Calculate stats
  const stats = useMemo(() => {
    const totalSouls = newcomers.length;
    const pendingFollowUp = newcomers.filter(
      (n) => n.status === "New" || n.status === "First Timer" || n.status === "Follow-up Pending",
    ).length;
    
    // Calculate Retention Rate: (Members / Total) * 100
    const members = newcomers.filter((n) => n.status === "Member").length;
    const retentionRate = totalSouls > 0 ? Math.round((members / totalSouls) * 100) : 0;

    return { totalSouls, pendingFollowUp, retentionRate };
  }, [newcomers]);

  // Group newcomers by column based on their status
  const groupedNewcomers = useMemo(() => {
    const groups: Record<string, Newcomer[]> = {
      "new-arrivals": [],
      contacted: [],
      engaged: [],
      member: [],
    };

    newcomers.forEach((newcomer) => {
      const status = newcomer.status || "New";
      if (status === "New" || status === "First Timer") {
        groups["new-arrivals"].push(newcomer);
      } else if (status === "Contacted") {
        groups["contacted"].push(newcomer);
      } else if (status === "Engaged" || status === "Follow-up Pending") {
        groups["engaged"].push(newcomer);
      } else if (status === "Member") {
        groups["member"].push(newcomer);
      } else {
        // Default to New Arrivals for unknown statuses
        groups["new-arrivals"].push(newcomer);
      }
    });

    // Filter by search query (using debounced value)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      Object.keys(groups).forEach((key) => {
        groups[key] = groups[key].filter((n) => {
          // Search in name, email, phone
          const basicMatch =
            n.full_name.toLowerCase().includes(query) ||
            n.email?.toLowerCase().includes(query) ||
            n.phone?.toLowerCase().includes(query);

          // Search in interest areas (array)
          const interestMatch = n.interest_areas?.some((area) =>
            area.toLowerCase().includes(query)
          );

          // Search in occupation
          const occupationMatch = n.occupation?.toLowerCase().includes(query);

          // Use cached parse results to avoid repeated parsing
          let parsed = parseNotesCache.current.get(n.id);
          if (!parsed) {
            parsed = parseNotes(n.notes);
            parseNotesCache.current.set(n.id, parsed);
          }
          
          const sectorMatch = parsed.sector?.toLowerCase().includes(query);
          const professionMatch = parsed.profession?.toLowerCase().includes(query);

          // Search in departments from notes
          const departmentMatch = parsed.departments?.some((dept) =>
            dept.toLowerCase().includes(query)
          );

          return (
            basicMatch ||
            interestMatch ||
            occupationMatch ||
            sectorMatch ||
            professionMatch ||
            departmentMatch
          );
        });
      });
    }

    return groups;
  }, [newcomers, debouncedSearchQuery]);

  // Apply assignment filter to grouped newcomers
  const filteredGroupedNewcomers = useMemo(() => {
    if (assignmentFilter === "all") {
      return groupedNewcomers;
    }

    const filtered: Record<string, Newcomer[]> = {
      "new-arrivals": [],
      contacted: [],
      engaged: [],
      member: [],
    };

    Object.keys(groupedNewcomers).forEach((key) => {
      filtered[key] = groupedNewcomers[key].filter((newcomer: Newcomer) => {
        if (assignmentFilter === "unassigned") {
          return !newcomer.assigned_to;
        } else if (assignmentFilter === "assigned") {
          return !!newcomer.assigned_to && !newcomer.contacted;
        } else if (assignmentFilter === "contacted") {
          return !!newcomer.contacted;
        }
        return true;
      });
    });

    return filtered;
  }, [groupedNewcomers, assignmentFilter]);

  const handleDragEnd = useCallback((result: { destination: { droppableId: string; index: number } | null; source: { droppableId: string; index: number }; draggableId: string }) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newcomerId = draggableId;
    const newcomer = newcomers.find((n) => n.id === newcomerId);
    if (!newcomer) return;

    const newStatus = getStatusForColumn(destination.droppableId);
    const columnTitle = COLUMNS.find((c) => c.id === destination.droppableId)
      ?.title || "Unknown";

    // Store original status for rollback
    const originalStatus = newcomer.status || "New";

    // INSTANT UI UPDATE - Use startTransition for instant, non-blocking feedback
    startTransition(() => {
      setNewcomers((prev) =>
        prev.map((item) =>
          item.id === newcomerId ? { ...item, status: newStatus } : item
        )
      );

      // Update selected newcomer if it's the one being moved
      if (selectedNewcomer?.id === newcomerId) {
        setSelectedNewcomer((prev) => prev ? { ...prev, status: newStatus } : null);
        selectedNewcomerRef.current = selectedNewcomer ? { ...selectedNewcomer, status: newStatus } : null;
      }
    });

    // DEFER all non-critical operations using setTimeout (runs after UI update)
    setTimeout(() => {
      // Trigger confetti if moved to Member (deferred)
      if (destination.droppableId === "member") {
        triggerConfetti();
      }

      // Update database in background (truly non-blocking, fire-and-forget)
      const supabase = createClient();
      const updateData: NewcomerUpdate = {
        status: newStatus,
      };

      supabase
        .from("newcomers")
        .update(updateData)
        .eq("id", newcomerId)
        .then(({ error }) => {
          if (error) {
            // Rollback on error
            setNewcomers((prev) =>
              prev.map((item) =>
                item.id === newcomerId ? { ...item, status: originalStatus } : item
              )
            );
            if (selectedNewcomer?.id === newcomerId) {
              setSelectedNewcomer((prev) => prev ? { ...prev, status: originalStatus } : null);
              selectedNewcomerRef.current = selectedNewcomer ? { ...selectedNewcomer, status: originalStatus } : null;
            }
            console.error("Error updating status:", error);
            return;
          }

          // Store undo information (deferred)
          setLastDragOperation({
            newcomerId: newcomerId,
            fromStatus: originalStatus,
            toStatus: newStatus,
            newcomerName: newcomer.full_name,
          });

          // Auto-hide undo button after 10 seconds
          setTimeout(() => {
            setLastDragOperation(null);
          }, 10000);

          // Add to activity log (deferred)
          setActivityLog((prev) => [
            {
              id: Date.now().toString(),
              message: `${currentUserName} moved ${newcomer.full_name} to ${columnTitle}`,
              timestamp: new Date(),
            },
            ...prev.slice(0, 9), // Keep last 10 activities
          ]);
        })
        .catch((error) => {
          console.error("Error updating status:", error);
        });
    }, 0); // Execute on next tick, after UI update completes
  }, [newcomers, selectedNewcomer, currentUserName]);

  // Handle assign follow-up
  const handleAssignFollowup = useCallback(async (userId: string) => {
    if (!newcomerToAssign) return;

    const newcomerId = newcomerToAssign.id;
    const originalAssignee = newcomerToAssign.assigned_to;

    // Get current admin user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user");
      return;
    }

    // Optimistic UI update
    startTransition(() => {
      setNewcomers((prev) =>
        prev.map((item) =>
          item.id === newcomerId
            ? {
                ...item,
                assigned_to: userId,
                assigned_at: new Date().toISOString(),
                assigned_by: user.id,
              }
            : item
        )
      );

      // Update selected newcomer if it's the one being assigned
      if (selectedNewcomer?.id === newcomerId) {
        setSelectedNewcomer((prev) =>
          prev
            ? {
                ...prev,
                assigned_to: userId,
                assigned_at: new Date().toISOString(),
                assigned_by: user.id,
              }
            : null
        );
      }
    });

    // Send notification
    const assignedStaff = staffMembers.find((s) => s.id === userId);
    if (assignedStaff && newcomerToAssign) {
      try {
        await fetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            type: "followup",
            title: "New follow-up assigned",
            message: newcomerToAssign.full_name,
            link: "/dashboard?tab=followups",
          }),
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
        // Don't fail the assignment if notification fails
      }
    }

    // Update database in background
    setTimeout(() => {
      const updateData: NewcomerUpdate = {
        assigned_to: userId,
        assigned_at: new Date().toISOString(),
        assigned_by: user.id,
      };

      supabase
        .from("newcomers")
        .update(updateData)
        .eq("id", newcomerId)
        .then(({ error }) => {
          if (error) {
            // Rollback on error
            setNewcomers((prev) =>
              prev.map((item) =>
                item.id === newcomerId
                  ? { ...item, assigned_to: originalAssignee }
                  : item
              )
            );
            console.error("Error assigning follow-up:", error);
            alert("Failed to assign follow-up. Please try again.");
            return;
          }

          // Fetch assigned user name for activity log
          const assignedUser = staffMembers.find((s) => s.id === userId);
          const assignedUserName = assignedUser?.full_name || assignedUser?.email || "Team Member";
          setActivityLog((prev) => [
            {
              id: Date.now().toString(),
              message: `${currentUserName} assigned ${newcomerToAssign.full_name} to ${assignedUserName}`,
              timestamp: new Date(),
            },
            ...prev.slice(0, 9),
          ]);
        })
        .catch((error: unknown) => {
          console.error("Error assigning follow-up:", error);
        });
    }, 0);
  }, [newcomerToAssign, selectedNewcomer, currentUserName, staffMembers]);

  // Undo last drag operation
  const handleUndo = useCallback(async () => {
    if (!lastDragOperation) return;

    const { newcomerId, fromStatus, toStatus, newcomerName } = lastDragOperation;

    // OPTIMISTIC UPDATE - Revert immediately
    setNewcomers((prev) =>
      prev.map((item) =>
        item.id === newcomerId ? { ...item, status: fromStatus } : item
      )
    );

    // Update selected newcomer if it's the one being reverted
    if (selectedNewcomer?.id === newcomerId) {
      setSelectedNewcomer({ ...selectedNewcomer, status: fromStatus });
      selectedNewcomerRef.current = { ...selectedNewcomer, status: fromStatus };
    }

    // Clear undo state
    setLastDragOperation(null);

    // Update database in background
    try {
      const supabase = createClient();
      const updateData: NewcomerUpdate = {
        status: fromStatus,
      };

      const { error } = await supabase
        .from("newcomers")
        .update(updateData)
        .eq("id", newcomerId);

      if (error) {
        // Rollback on error
        setNewcomers((prev) =>
          prev.map((item) =>
            item.id === newcomerId ? { ...item, status: toStatus } : item
          )
        );
        if (selectedNewcomer?.id === newcomerId) {
          setSelectedNewcomer({ ...selectedNewcomer, status: toStatus });
          selectedNewcomerRef.current = { ...selectedNewcomer, status: toStatus };
        }
        throw error;
      }

      // Add to activity log
      const getColumnTitleForStatus = (status: string): string => {
        if (status === "New" || status === "First Timer") {
          return "New Arrivals";
        } else if (status === "Contacted") {
          return "Contacted";
        } else if (status === "Engaged" || status === "Follow-up Pending") {
          return "Engaged";
        } else if (status === "Member") {
          return "Member";
        }
        return status;
      };
      
      const fromColumnTitle = getColumnTitleForStatus(fromStatus);

      setActivityLog((prev) => [
        {
          id: Date.now().toString(),
          message: `${currentUserName} moved ${newcomerName} back to ${fromColumnTitle}`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    } catch (error) {
      console.error("Error undoing status change:", error);
      alert("Failed to undo. Please try again.");
    }
  }, [lastDragOperation, selectedNewcomer, currentUserName]);

  const handleSaveNotes = async () => {
    if (!selectedNewcomer) return;

    setSaveStatus("saving");
    setSavingNotes(true);
    try {
      const supabase = createClient();
      const updateData: NewcomerUpdate = {
        notes: adminNotes || null,
      };

      const { error } = await supabase
        .from("newcomers")
        .update(updateData)
        .eq("id", selectedNewcomer.id);

      if (error) throw error;

      setNewcomers((prev) =>
        prev.map((item) =>
          item.id === selectedNewcomer.id
            ? { ...item, notes: adminNotes || null }
            : item,
        ),
      );

      setSelectedNewcomer({ ...selectedNewcomer, notes: adminNotes || null });
      
      // Add to activity log
      setActivityLog((prev) => [
        {
          id: Date.now().toString(),
          message: `${currentUserName} updated notes for ${selectedNewcomer.full_name}`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving notes:", error);
      setSaveStatus("idle");
    } finally {
      setSavingNotes(false);
    }
  };

  // Auto-save with debounce
  const handleNotesChange = (value: string) => {
    setAdminNotes(value);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second after user stops typing)
    saveTimeoutRef.current = setTimeout(() => {
      if (selectedNewcomer) {
        handleSaveNotes();
      }
    }, 1000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleCardClick = useCallback((newcomer: Newcomer) => {
    setSelectedNewcomer(newcomer);
    selectedNewcomerRef.current = newcomer;
    setAdminNotes(newcomer.notes || "");
    setIsSheetOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/newcomers/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete newcomer");
      }
      setNewcomers((prev) => prev.filter((item) => item.id !== id));
      if (selectedNewcomer?.id === id) {
        setIsSheetOpen(false);
        setSelectedNewcomer(null);
      }
    } catch (error) {
      console.error("Error deleting newcomer:", error);
      alert(error instanceof Error ? error.message : "Failed to delete newcomer");
    }
  }, [selectedNewcomer?.id]);

  // Handle assignment change
  const handleAssignmentChange = useCallback(async (newcomerId: string, assignedTo: string) => {
    // Optimistic update
    setNewcomers((prev) =>
      prev.map((item) =>
        item.id === newcomerId ? { ...item, assigned_to: assignedTo || null } : item
      )
    );

    // Update selected newcomer if it's the one being changed
    if (selectedNewcomer?.id === newcomerId) {
      const updated = { ...selectedNewcomer, assigned_to: assignedTo || null };
      setSelectedNewcomer(updated);
      selectedNewcomerRef.current = updated;
    }

    // Update database
    try {
      const supabase = createClient();
      const updateData: NewcomerUpdate = {
        assigned_to: assignedTo || null,
      };

      const { error } = await supabase
        .from("newcomers")
        .update(updateData)
        .eq("id", newcomerId);

      if (error) {
        // Rollback on error
        const originalNewcomer = newcomers.find((n) => n.id === newcomerId);
        if (originalNewcomer) {
          setNewcomers((prev) =>
            prev.map((item) =>
              item.id === newcomerId ? originalNewcomer : item
            )
          );
          if (selectedNewcomer?.id === newcomerId) {
            setSelectedNewcomer(originalNewcomer);
            selectedNewcomerRef.current = originalNewcomer;
          }
        }
        throw error;
      }

      // Add to activity log
      const assignedStaff = staffMembers.find((s) => s.id === assignedTo);
      const staffName = assignedStaff?.full_name || assignedStaff?.email || "Unassigned";
      const newcomerName = newcomers.find((n) => n.id === newcomerId)?.full_name || "Unknown";
      setActivityLog((prev) => [
        {
          id: Date.now().toString(),
          message: `${newcomerName} assigned to ${staffName}`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);

      // Send notification if assignment is made (not unassignment)
      if (assignedTo && assignedStaff) {
        const newcomer = newcomers.find((n) => n.id === newcomerId);
        if (newcomer) {
          try {
            await fetch("/api/admin/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: assignedTo,
                type: "followup",
                title: "New follow-up assigned",
                message: newcomerName,
                link: "/dashboard?tab=followups",
              }),
            });
          } catch (notifyError) {
            console.error("Error sending notification:", notifyError);
            // Don't fail the assignment if notification fails
          }
        }
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  }, [newcomers, selectedNewcomer, staffMembers]);

  const getFollowupStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      contacted: "bg-green-500/20 text-green-300 border-green-500/30",
      completed: "bg-green-500/20 text-green-300 border-green-500/30",
      no_response: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colors[status] || colors.not_started;
  };

  const getFollowupStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      contacted: "Contacted",
      completed: "Completed",
      no_response: "No Response",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-3">
      {/* Real-time Connection Status Indicator - Compact */}
      <div className="flex items-center justify-between gap-2">
        {!isRealtimeConnected && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-amber-400 flex-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span className="text-[10px]">
                Real-time updates disabled. Refresh to see new entries.
              </span>
            </div>
          </div>
        )}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium backdrop-blur-md border flex-shrink-0 ${
          isRealtimeConnected 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {isRealtimeConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Summary Stats Cards - Compact Single Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-2xl relative overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-300">
                  Total Souls
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-white">
                    {stats.totalSouls}
                  </p>
                  {/* Growth Sparkline - Smaller */}
                  <div className="flex items-end gap-0.5 h-6">
                    {[2, 4, 3, 5, 4, 6, 5].map((height, idx) => (
                      <motion.div
                        key={idx}
                        className="w-0.5 bg-blue-400/60 rounded-t"
                        initial={{ height: 0 }}
                        animate={{ height: `${height * 3}px` }}
                        transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-blue-500/30">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 backdrop-blur-md border-[#ef4444]/30 shadow-2xl relative overflow-hidden ring-1 ring-[#ef4444]/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-300">
                  Pending Follow-up
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.pendingFollowUp}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#ef4444]/20 backdrop-blur-sm flex items-center justify-center border border-[#ef4444]/30">
                <AlertCircle className="h-4 w-4 text-[#ef4444]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 backdrop-blur-md border-[#22c55e]/30 shadow-2xl relative overflow-hidden ring-1 ring-[#22c55e]/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-300">Retention Rate</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-white">
                    {stats.retentionRate}%
                  </p>
                  {/* Growth Sparkline - Smaller */}
                  <div className="flex items-end gap-0.5 h-6">
                    {[3, 5, 4, 6, 5, 7, 6].map((height, idx) => (
                      <motion.div
                        key={idx}
                        className="w-0.5 bg-green-400/60 rounded-t"
                        initial={{ height: 0 }}
                        animate={{ height: `${height * 3}px` }}
                        transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#22c55e]/20 backdrop-blur-sm flex items-center justify-center border border-[#22c55e]/30">
                <TrendingUp className="h-4 w-4 text-[#22c55e]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar and Undo Button - Compact */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search by name, interest area, career..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-slate-800/30 backdrop-blur-md border-slate-700/50 text-white placeholder:text-slate-500"
          />
        </div>
        
        {/* Undo Button - Compact */}
        <AnimatePresence>
          {lastDragOperation && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Button
                onClick={handleUndo}
                variant="outline"
                size="sm"
                className="h-9 bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 backdrop-blur-sm text-xs px-2"
                title={`Undo: Move ${lastDragOperation.newcomerName} back to previous column`}
              >
                <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Undo: </span>
                <span className="max-w-[100px] truncate">
                  {lastDragOperation.newcomerName}
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Kanban Board - 2025 Deep Command */}
      {hasMounted ? (
        <DragDropContext 
          onDragEnd={handleDragEnd}
          onDragStart={() => {}}
        >
        <div className="pb-2">
          <div className="flex flex-col lg:flex-row gap-3">
            {COLUMNS.map((column) => (
              <div
                key={column.id}
                className={`flex-shrink-0 w-full lg:w-72 ${column.color} rounded-lg border backdrop-blur-md bg-slate-900/40 p-3 shadow-2xl ${column.glow || ""} flex flex-col`}
              >
                <h2 className="font-semibold text-white mb-2 text-base">
                  {column.title}
                </h2>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto space-y-2 transition-all duration-200 pr-1 ${
                        snapshot.isDraggingOver
                          ? "bg-slate-700/30 rounded-lg p-2 backdrop-blur-sm"
                          : ""
                      }`}
                    >
                      {filteredGroupedNewcomers[column.id].map(
                        (newcomer: Newcomer, index: number) => {
                          const isOld24h =
                            column.id === "new-arrivals" &&
                            isOlderThan24Hours(newcomer.created_at);
                          const isOld48h =
                            column.id === "new-arrivals" &&
                            isOlderThan48Hours(newcomer.created_at);
                          const isOld72h =
                            column.id === "new-arrivals" &&
                            (newcomer.status === "New" || newcomer.status === "First Timer") &&
                            isOlderThan72Hours(newcomer.created_at);
                          const isHovered = hoveredCard === newcomer.id;

                          return (
                            <Draggable
                              key={newcomer.id}
                              draggableId={newcomer.id}
                              index={index}
                            >
                              {(provided, snapshot) => {
                                // Use cached parseNotes result
                                let parsed = parseNotesCache.current.get(newcomer.id);
                                if (!parsed) {
                                  parsed = parseNotes(newcomer.notes);
                                  parseNotesCache.current.set(newcomer.id, parsed);
                                }

                                return (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onMouseEnter={() =>
                                    setHoveredCard(newcomer.id)
                                  }
                                  onMouseLeave={() => setHoveredCard(null)}
                                  className={`relative cursor-grab active:cursor-grabbing bg-slate-900/40 backdrop-blur-sm border-slate-700/50 shadow-lg hover:shadow-xl rounded-lg transition-transform duration-150 will-change-transform ${
                                    snapshot.isDragging
                                      ? "shadow-2xl z-50 scale-[1.02] rotate-1"
                                      : ""
                                  } ${
                                    isOld72h
                                      ? "border-red-500 animate-pulse ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                      : isOld48h
                                      ? "ring-2 ring-[#ef4444]/50 border-[#ef4444]/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                      : ""
                                  } ${
                                    isOld24h && !isOld48h && !isOld72h
                                      ? "animate-pulse border-l-4 border-l-yellow-500"
                                      : ""
                                  } ${
                                    (newcomer as Newcomer & { followup_status?: string }).followup_status === "no_response"
                                      ? "border-l-4 border-l-red-500"
                                      : (newcomer as Newcomer & { followup_status?: string }).followup_status === "completed"
                                      ? "border-l-4 border-l-green-500"
                                      : ""
                                  }`}
                                  onClick={() => handleCardClick(newcomer)}
                                >
                                  <CardContent className="p-3">
                                    <div className="space-y-1.5">
                                      {/* Assignment Status Badges */}
                                      <div className="flex flex-wrap gap-1 mb-1">
                                        {newcomer.assigned_to && (
                                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] px-1.5 py-0.5">
                                            Assigned
                                          </Badge>
                                        )}
                                        {newcomer.contacted && (
                                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] px-1.5 py-0.5">
                                            Contacted ✓
                                          </Badge>
                                        )}
                                        {(newcomer as Newcomer & { followup_status?: string }).followup_status && (
                                          <Badge className={`text-[10px] px-1.5 py-0.5 border ${getFollowupStatusBadgeColor((newcomer as Newcomer & { followup_status?: string }).followup_status || "not_started")}`}>
                                            {getFollowupStatusLabel((newcomer as Newcomer & { followup_status?: string }).followup_status || "not_started")}
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Name and Transport Icon - Top Section */}
                                      <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-white text-xs flex-1 leading-tight">
                                          {newcomer.full_name}
                                        </h3>
                                        {/* Transport Icon - Top Right, Smaller and Muted */}
                                        {(() => {
                                          // parsed is already available from above
                                          // Check needs_transport field if it exists, otherwise check parsed notes
                                          const needsTransport = 
                                            (newcomer as Newcomer & { needs_transport?: boolean }).needs_transport === true || // Check database field if exists
                                            (parsed.transport && 
                                             parsed.transport !== "My Car" && 
                                             parsed.transport !== "Public Transport");
                                          
                                          return needsTransport ? (
                                            <Bus 
                                              className="h-3.5 w-3.5 text-amber-400/70 flex-shrink-0 mt-0.5" 
                                              title={`Needs Transport: ${parsed.transport || 'Yes'}`}
                                            />
                                          ) : null;
                                        })()}
                                      </div>

                                      {/* How did you hear - Muted */}
                                      {newcomer.how_did_you_hear && (
                                        <p className="text-xs text-slate-500/70">
                                          {newcomer.how_did_you_hear}
                                        </p>
                                      )}

                                      {/* Interest Areas Badges - Show only first 2, More Muted */}
                                      {newcomer.interest_areas && newcomer.interest_areas.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {newcomer.interest_areas.slice(0, 2).map((area, idx) => {
                                            // Color mapping for different interest areas - More muted
                                            const colorMap: Record<string, string> = {
                                              "Choir": "bg-purple-500/15 text-purple-300/80 border-purple-500/20",
                                              "Multimedia": "bg-blue-500/15 text-blue-300/80 border-blue-500/20",
                                              "Evangelism": "bg-red-500/15 text-red-300/80 border-red-500/20",
                                              "Media": "bg-cyan-500/15 text-cyan-300/80 border-cyan-500/20",
                                              "Worship": "bg-pink-500/15 text-pink-300/80 border-pink-500/20",
                                              "Youth": "bg-orange-500/15 text-orange-300/80 border-orange-500/20",
                                              "Children": "bg-yellow-500/15 text-yellow-300/80 border-yellow-500/20",
                                              "Outreach": "bg-emerald-500/15 text-emerald-300/80 border-emerald-500/20",
                                              "Administration": "bg-indigo-500/15 text-indigo-300/80 border-indigo-500/20",
                                              "Music": "bg-rose-500/15 text-rose-300/80 border-rose-500/20",
                                              "Teaching": "bg-teal-500/15 text-teal-300/80 border-teal-500/20",
                                            };
                                            const colorClass = colorMap[area] || "bg-slate-500/15 text-slate-300/80 border-slate-500/20";
                                            return (
                                              <Badge
                                                key={idx}
                                                className={`text-[10px] px-1.5 py-0.5 border ${colorClass}`}
                                              >
                                                {area}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Also check departments from parsed notes if no interest_areas - Show only first 2 */}
                                      {(() => {
                                        // parsed is already available from above scope
                                        const departments = parsed.departments || [];
                                        const interestAreas = newcomer.interest_areas || [];
                                        
                                        // Only show departments if interest_areas is empty
                                        if (departments.length > 0 && interestAreas.length === 0) {
                                          return (
                                            <div className="flex flex-wrap gap-1">
                                              {departments.slice(0, 2).map((dept, idx) => {
                                                const colorMap: Record<string, string> = {
                                                  "Choir": "bg-purple-500/15 text-purple-300/80 border-purple-500/20",
                                                  "Multimedia": "bg-blue-500/15 text-blue-300/80 border-blue-500/20",
                                                  "Evangelism": "bg-red-500/15 text-red-300/80 border-red-500/20",
                                                  "Media": "bg-cyan-500/15 text-cyan-300/80 border-cyan-500/20",
                                                  "Children's Teacher": "bg-yellow-500/15 text-yellow-300/80 border-yellow-500/20",
                                                  "Teens Teacher": "bg-orange-500/15 text-orange-300/80 border-orange-500/20",
                                                  "Sunday school Teacher": "bg-amber-500/15 text-amber-300/80 border-amber-500/20",
                                                  "Social Media": "bg-pink-500/15 text-pink-300/80 border-pink-500/20",
                                                  "Ushering": "bg-indigo-500/15 text-indigo-300/80 border-indigo-500/20",
                                                  "Hospitality": "bg-emerald-500/15 text-emerald-300/80 border-emerald-500/20",
                                                  "Welcome Team": "bg-teal-500/15 text-teal-300/80 border-teal-500/20",
                                                  "Parking": "bg-slate-500/15 text-slate-300/80 border-slate-500/20",
                                                  "Sanctuary": "bg-violet-500/15 text-violet-300/80 border-violet-500/20",
                                                  "Transport": "bg-amber-500/15 text-amber-300/80 border-amber-500/20",
                                                  "Decoration": "bg-rose-500/15 text-rose-300/80 border-rose-500/20",
                                                  "Announcement": "bg-blue-500/15 text-blue-300/80 border-blue-500/20",
                                                };
                                                const colorClass = colorMap[dept] || "bg-slate-500/15 text-slate-300/80 border-slate-500/20";
                                                return (
                                                  <Badge
                                                    key={idx}
                                                    className={`text-[10px] px-1.5 py-0.5 border ${colorClass}`}
                                                  >
                                                    {dept}
                                                  </Badge>
                                                );
                                              })}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}

                                      {/* Age/Retention Alerts - More Muted */}
                                      {isOld72h && (
                                        <div className="flex items-center gap-1 text-xs text-[#ef4444]/80 font-medium">
                                          <AlertCircle className="h-3 w-3 animate-pulse" />
                                          <span>URGENT: Over 72 hours</span>
                                        </div>
                                      )}
                                      {isOld48h && !isOld72h && (
                                        <div className="flex items-center gap-1 text-xs text-[#ef4444]/70">
                                          <AlertCircle className="h-3 w-3" />
                                          <span>Over 48 hours</span>
                                        </div>
                                      )}

                                      {/* Assigned Staff Badge - More Muted */}
                                      {newcomer.assigned_to && (() => {
                                        const assignedStaff = staffMembers.find((s) => s.id === newcomer.assigned_to);
                                        return assignedStaff ? (
                                          <div className="flex items-center gap-1">
                                            <Badge className="text-[10px] px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300/70 border-indigo-500/20">
                                              {assignedStaff.full_name || assignedStaff.email || "Assigned"}
                                            </Badge>
                                          </div>
                                        ) : null;
                                      })()}

                                      {/* Follow-up Status Display */}
                                      {(newcomer as Newcomer & { followup_status?: string; last_followup_at?: string }).followup_status && (
                                        <div className="pt-1">
                                          <div className="flex items-center gap-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getFollowupStatusBadgeColor((newcomer as Newcomer & { followup_status?: string }).followup_status || "not_started")}`}>
                                              {getFollowupStatusLabel((newcomer as Newcomer & { followup_status?: string }).followup_status || "not_started")}
                                            </span>
                                            {(newcomer as Newcomer & { last_followup_at?: string }).last_followup_at && (
                                              <span className="text-[10px] text-slate-500">
                                                {new Date((newcomer as Newcomer & { last_followup_at?: string }).last_followup_at!).toLocaleDateString()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Assigned To Dropdown - At bottom of card */}
                                      <div className="pt-2 border-t border-slate-700/30" onClick={(e) => e.stopPropagation()}>
                                        <Label className="text-[10px] text-slate-400 mb-1 block">Assigned To</Label>
                                        <select
                                          value={newcomer.assigned_to || ""}
                                          onChange={(e) => handleAssignmentChange(newcomer.id, e.target.value)}
                                          className="w-full text-xs bg-slate-800/50 border border-slate-700/50 rounded-md px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value="">Unassigned</option>
                                          {staffMembers.map((staff) => (
                                            <option key={staff.id} value={staff.id}>
                                              {staff.full_name || staff.email || "Unknown"}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Service Attended - Bottom of Card, Muted */}
                                      {newcomer.service_time && (
                                        <p className="text-xs text-slate-500/70 mt-2 pt-2 border-t border-slate-700/30">
                                          {newcomer.service_time}
                                        </p>
                                      )}

                                      {/* Quick Actions Floating Menu - Show on Hover */}
                                      {isHovered && (
                                        <div
                                          className="absolute top-2 right-2 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-lg p-2 shadow-xl z-10 transition-opacity duration-150"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex gap-1">
                                            {newcomer.phone && (
                                              <>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0 hover:bg-slate-700/50"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `tel:${formatPhoneForLink(
                                                      newcomer.phone,
                                                    )}`;
                                                  }}
                                                  title="Call"
                                                >
                                                  <Phone className="h-4 w-4 text-slate-300" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0 hover:bg-slate-700/50"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(
                                                      generateWhatsAppUrl(newcomer.phone, newcomer.full_name),
                                                      "_blank",
                                                    );
                                                  }}
                                                  title="WhatsApp with welcome message"
                                                >
                                                  <MessageCircle className="h-4 w-4 text-slate-300" />
                                                </Button>
                                              </>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 hover:bg-slate-700/50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCardClick(newcomer);
                                              }}
                                              title="View Profile"
                                            >
                                              <User className="h-4 w-4 text-slate-300" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 hover:bg-slate-700/50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setNewcomerToAssign(newcomer);
                                                setAssignDialogOpen(true);
                                              }}
                                              title="Assign Follow-up"
                                            >
                                              <UserPlus className="h-4 w-4 text-slate-300" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 hover:bg-red-900/30 text-red-400 hover:text-red-300"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(newcomer.id, newcomer.full_name);
                                              }}
                                              title="Delete"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      {updatingId === newcomer.id && (
                                        <div className="flex justify-center pt-2">
                                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </div>
                                );
                              }}
                            </Draggable>
                          );
                        },
                      )}
                      {/* Quick Add Placeholder for Empty Columns */}
                      {filteredGroupedNewcomers[column.id].length === 0 && (
                        <div
                          className="bg-slate-800/20 backdrop-blur-sm border-2 border-dashed border-slate-700/30 rounded-lg p-4 text-center cursor-pointer hover:border-slate-600/50 transition-colors"
                        >
                          <Plus className="h-5 w-5 text-slate-500 mx-auto mb-1" />
                          <p className="text-xs text-slate-400">Quick Add</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Drag a card here</p>
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
      ) : (
        <div className="flex items-center justify-center min-h-[400px] bg-slate-900/40 rounded-xl border border-slate-700/50">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
            <p className="text-slate-400">Loading Kanban Board...</p>
          </div>
        </div>
      )}

      {/* Live Activity Ticker */}
      {activityLog.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 z-40 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="flex-shrink-0 text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse"></div>
                Live Activity
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="flex gap-6 animate-scroll whitespace-nowrap">
                  {[...activityLog, ...activityLog].map((activity, idx) => (
                    <div
                      key={`${activity.id}-${idx}`}
                      className="flex-shrink-0 text-sm text-slate-300"
                    >
                      <span className="text-[#22c55e] mr-2">●</span>
                      {activity.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Follow-up Dialog */}
      {hasMounted && newcomerToAssign && (
        <AssignFollowupDialog
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) {
              setNewcomerToAssign(null);
            }
          }}
          onAssign={handleAssignFollowup}
          newcomerName={newcomerToAssign.full_name}
          currentAssigneeId={newcomerToAssign.assigned_to}
        />
      )}

      {/* Enhanced Details Sheet - Glassmorphism */}
      {hasMounted && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <SheetHeader>
            <SheetTitle className="text-white">
              {selectedNewcomer?.full_name}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Complete visitor profile and follow-up information
            </SheetDescription>
          </SheetHeader>

          {selectedNewcomer && (() => {
            const parsedNotes = parseNotes(selectedNewcomer.notes);
            return (
              <div className="mt-6">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-700/50 mb-4">
                  {selectedNewcomer.phone && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          (window.location.href = `tel:${formatPhoneForLink(
                            selectedNewcomer.phone,
                          )}`)
                        }
                        className="border-slate-700/50 hover:bg-slate-800/50 backdrop-blur-sm"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            generateWhatsAppUrl(selectedNewcomer.phone, selectedNewcomer.full_name),
                            "_blank",
                          )
                        }
                        className="border-slate-700/50 hover:bg-slate-800/50 backdrop-blur-sm"
                        title="Open WhatsApp with pre-filled welcome message"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </>
                  )}
                  {selectedNewcomer.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `mailto:${selectedNewcomer.email}`)
                      }
                      className="border-slate-700/50 hover:bg-slate-800/50 backdrop-blur-sm"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(selectedNewcomer.id, selectedNewcomer.full_name)}
                    className="border-red-700/50 hover:bg-red-900/30 text-red-400 hover:text-red-300 ml-auto"
                    title="Delete this record"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>

                {/* Tabs - 2025 Deep Command */}
                <Tabs defaultValue="spiritual" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-900/40 backdrop-blur-md border border-slate-700/50">
                    <TabsTrigger value="spiritual" className="data-[state=active]:bg-slate-800/50 data-[state=active]:text-white text-slate-300 data-[state=active]:ring-1 data-[state=active]:ring-slate-600/50">
                      Spiritual Info
                    </TabsTrigger>
                    <TabsTrigger value="professional" className="data-[state=active]:bg-slate-800/50 data-[state=active]:text-white text-slate-300 data-[state=active]:ring-1 data-[state=active]:ring-slate-600/50">
                      Professional/Skills
                    </TabsTrigger>
                    <TabsTrigger value="ministry" className="data-[state=active]:bg-slate-800/50 data-[state=active]:text-white text-slate-300 data-[state=active]:ring-1 data-[state=active]:ring-slate-600/50">
                      Ministry Interests
                    </TabsTrigger>
                  </TabsList>

                  {/* Follow-up Assignment Section - Above Tabs */}
                  <div className="mt-4 space-y-4">
                    {/* Assigned To Section */}
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                      <Label className="text-sm font-medium text-slate-300 mb-2 block">Assigned To</Label>
                      <select
                        value={selectedNewcomer.assigned_to || ""}
                        onChange={(e) => handleAssignmentChange(selectedNewcomer.id, e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="">Unassigned</option>
                        {staffMembers.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.full_name || staff.email || "Unknown"}
                          </option>
                        ))}
                      </select>
                      {selectedNewcomer.assigned_to && (() => {
                        const assignedStaff = staffMembers.find((s) => s.id === selectedNewcomer.assigned_to);
                        return assignedStaff ? (
                          <p className="text-xs text-slate-400 mt-2">
                            Assigned to: {assignedStaff.full_name || assignedStaff.email || "Unknown"}
                          </p>
                        ) : null;
                      })()}
                      {selectedNewcomer.assigned_at && (
                        <p className="text-xs text-slate-400 mt-1">
                          Assigned on: {new Date(selectedNewcomer.assigned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Contact Status Section */}
                    {selectedNewcomer.assigned_to && (
                      <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-slate-300">Contact Status</Label>
                          {selectedNewcomer.contacted ? (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              Contacted ✓
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                              Not Contacted
                            </Badge>
                          )}
                        </div>
                        {selectedNewcomer.contacted && selectedNewcomer.contacted_at && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-400">
                              Contacted on: {new Date(selectedNewcomer.contacted_at).toLocaleString()}
                            </p>
                            {selectedNewcomer.contact_notes && (
                              <div>
                                <p className="text-xs font-medium text-slate-400 mb-1">Contact Notes:</p>
                                <p className="text-sm text-slate-300 bg-slate-800/50 rounded p-2 border border-slate-700/50">
                                  {selectedNewcomer.contact_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        {!selectedNewcomer.contacted && (
                          <p className="text-xs text-slate-400 italic">
                            Waiting for team member to mark as contacted
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Spiritual Info Tab */}
                  <TabsContent value="spiritual" className="mt-4 space-y-4">
                    {/* Contact Info Section */}
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                      <h3 className="font-semibold text-lg text-white mb-4">Contact Information</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-3 border border-slate-700/50">
                          <p className="text-sm font-medium text-slate-400">Phone</p>
                          <p className="text-base text-white">
                            {selectedNewcomer.phone || "-"}
                          </p>
                        </div>
                        {parsedNotes.whatsapp && (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-3 border border-slate-700/50">
                            <p className="text-sm font-medium text-slate-400 mb-2">WhatsApp</p>
                            <p className="text-base text-white mb-2">{parsedNotes.whatsapp}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  generateWhatsAppUrl(parsedNotes.whatsapp, selectedNewcomer.full_name),
                                  "_blank",
                                )
                              }
                              className="border-green-500/50 hover:bg-green-500/20 text-green-400"
                              title="Open WhatsApp with pre-filled welcome message"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Open WhatsApp
                            </Button>
                          </div>
                        )}
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-3 border border-slate-700/50">
                          <p className="text-sm font-medium text-slate-400">Email</p>
                          <p className="text-base text-white">
                            {selectedNewcomer.email || "-"}
                          </p>
                        </div>
                        <div className="sm:col-span-2 bg-slate-900/40 backdrop-blur-md rounded-lg p-3 border border-slate-700/50">
                          <p className="text-sm font-medium text-slate-400">
                            Address
                          </p>
                          <p className="text-base text-white">
                            {selectedNewcomer.address || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {(parsedNotes.bornAgain || parsedNotes.baptised || parsedNotes.startDate) ? (
                      <>
                        {parsedNotes.bornAgain && (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                            <h3 className="font-semibold text-lg text-white mb-3">Born Again</h3>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-slate-400">Status</p>
                                <p className="text-base text-white">{parsedNotes.bornAgain}</p>
                              </div>
                              {parsedNotes.bornAgainDetails && (
                                <div>
                                  <p className="text-sm font-medium text-slate-400">When/Where</p>
                                  <p className="text-base text-white">{parsedNotes.bornAgainDetails}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {parsedNotes.baptised && (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                            <h3 className="font-semibold text-lg text-white mb-3">Baptism</h3>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-slate-400">Baptised by Immersion</p>
                                <p className="text-base text-white">{parsedNotes.baptised}</p>
                              </div>
                              {parsedNotes.baptisedWhen && (
                                <div>
                                  <p className="text-sm font-medium text-slate-400">Baptism Date</p>
                                  <p className="text-base text-white">{parsedNotes.baptisedWhen}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {parsedNotes.startDate && (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                            <h3 className="font-semibold text-lg text-white mb-3">Start Date at POJ</h3>
                            <p className="text-base text-white">{parsedNotes.startDate}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-8 border border-slate-700/50 text-center">
                        <p className="text-slate-400">No spiritual information available yet.</p>
                      </div>
                    )}

                    {/* Live Follow-up Log */}
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-white">Live Follow-up Log</h3>
                        {saveStatus === "saving" && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </div>
                        )}
                        {saveStatus === "saved" && (
                          <div className="flex items-center gap-2 text-sm text-[#22c55e]">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Saved</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="follow-up-log" className="text-slate-400">
                          Type notes here - they save automatically
                        </Label>
                        <textarea
                          id="follow-up-log"
                          rows={6}
                          value={adminNotes}
                          onChange={(e) => handleNotesChange(e.target.value)}
                          className="flex w-full rounded-md border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm px-3 py-2 text-sm text-white ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Add follow-up notes, meeting details, or any other relevant information. Changes save automatically..."
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Professional/Skills Tab */}
                  <TabsContent value="professional" className="mt-4 space-y-4">
                    {(selectedNewcomer.occupation || parsedNotes.profession || parsedNotes.sector || parsedNotes.hasChildren) ? (
                      <div className="space-y-4">
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                          <h3 className="font-semibold text-lg text-white mb-4">Career & Skills</h3>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {selectedNewcomer.occupation && (
                              <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-3 border border-slate-700/50">
                                <p className="text-sm font-medium text-slate-400">Occupation</p>
                                <p className="text-base text-white mt-1">
                                  {selectedNewcomer.occupation}
                                </p>
                              </div>
                            )}
                            {parsedNotes.profession && (
                              <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-3 border border-slate-700/50">
                                <p className="text-sm font-medium text-slate-400">Profession</p>
                                <p className="text-base text-white">{parsedNotes.profession}</p>
                              </div>
                            )}
                            {parsedNotes.sector && (
                              <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-3 border border-slate-700/50">
                                <p className="text-sm font-medium text-slate-400">Sector</p>
                                <p className="text-base text-white">{parsedNotes.sector}</p>
                              </div>
                            )}
                            {parsedNotes.hasChildren && (
                              <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-3 border border-slate-700/50">
                                <p className="text-sm font-medium text-slate-400">Has Children</p>
                                <p className="text-base text-white">Yes</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-8 border border-slate-700/50 text-center">
                        <p className="text-slate-400">No professional information available yet.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Ministry Tab */}
                  <TabsContent value="ministry" className="mt-4 space-y-4">
                    {(selectedNewcomer.interest_areas && selectedNewcomer.interest_areas.length > 0) || parsedNotes.departments ? (
                      <div className="space-y-4">
                        {selectedNewcomer.interest_areas && selectedNewcomer.interest_areas.length > 0 && (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                            <h3 className="font-semibold text-lg text-white mb-3">Interest Areas</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedNewcomer.interest_areas.map((area, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 cursor-pointer transition-all"
                                >
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {parsedNotes.departments && parsedNotes.departments.length > 0 && (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                            <h3 className="font-semibold text-lg text-white mb-3">Ministry Departments</h3>
                            <div className="flex flex-wrap gap-2">
                              {parsedNotes.departments.map((dept, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30 cursor-pointer transition-all"
                                >
                                  {dept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {parsedNotes.joinWorkforce && (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
                            <h3 className="font-semibold text-lg text-white mb-2">Workforce Participation</h3>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              Interested in joining workforce
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-900/40 backdrop-blur-md rounded-lg p-8 border border-slate-700/50 text-center">
                        <p className="text-slate-400">No interest areas or departments specified yet.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

              </div>
            );
          })()}
        </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
