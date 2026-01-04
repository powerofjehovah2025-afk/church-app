"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Newcomer, NewcomerUpdate } from "@/types/database.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Search,
  ChevronDown,
  Loader2,
  Phone,
  MessageCircle,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";

interface NewcomersTableProps {
  initialData: Newcomer[];
}

const STATUS_OPTIONS = [
  "First Timer",
  "New",
  "Follow-up Pending",
  "Contacted",
  "Member",
  "Inactive",
];

const INTEREST_AREAS = [
  "Worship",
  "Media",
  "Youth",
  "Children",
  "Outreach",
  "Administration",
  "Music",
  "Teaching",
  "Choir",
  "Multimedia",
  "Evangelism",
  "Social Media",
  "Ushering",
  "Hospitality",
  "Welcome Team",
  "Parking",
  "Sanctuary",
  "Transport",
  "Decoration",
  "Announcement",
];

// Professional status colors
const getStatusColor = (status: string | null) => {
  switch (status) {
    case "New":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    case "First Timer":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "Follow-up Pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "Contacted":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "Member":
      return "bg-green-500/20 text-green-400 border-green-500/50";
    case "Inactive":
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPhoneForLink = (phone: string | null) => {
  if (!phone) return "";
  // Remove all non-numeric characters
  return phone.replace(/\D/g, "");
};

export function NewcomersTable({ initialData }: NewcomersTableProps) {
  const [newcomers, setNewcomers] = useState<Newcomer[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [interestFilter, setInterestFilter] = useState<string>("all");
  const [selectedNewcomer, setSelectedNewcomer] = useState<Newcomer | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const total = newcomers.length;
    const needsFollowUp = newcomers.filter(
      (n) => n.status === "New" || n.status === "First Timer",
    ).length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thisMonth = newcomers.filter(
      (n) => new Date(n.created_at) >= thirtyDaysAgo,
    ).length;

    return { total, needsFollowUp, thisMonth };
  }, [newcomers]);

  const filteredNewcomers = useMemo(() => {
    let filtered = newcomers;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (newcomer) =>
          newcomer.full_name.toLowerCase().includes(query) ||
          newcomer.email?.toLowerCase().includes(query) ||
          newcomer.phone?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((newcomer) => newcomer.status === statusFilter);
    }

    // Interest areas filter
    if (interestFilter !== "all") {
      filtered = filtered.filter(
        (newcomer) =>
          newcomer.interest_areas &&
          newcomer.interest_areas.includes(interestFilter),
      );
    }

    return filtered;
  }, [newcomers, searchQuery, statusFilter, interestFilter]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingStatus(id);

    try {
      const supabase = createClient();
      const updateData: NewcomerUpdate = {
        status: newStatus,
      };

      const { error } = await supabase
        .from("newcomers")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setNewcomers((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item,
        ),
      );

      // Update selected newcomer if it's the one being updated
      if (selectedNewcomer?.id === id) {
        setSelectedNewcomer({ ...selectedNewcomer, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedNewcomer) return;

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

      // Update local state
      setNewcomers((prev) =>
        prev.map((item) =>
          item.id === selectedNewcomer.id
            ? { ...item, notes: adminNotes || null }
            : item,
        ),
      );

      setSelectedNewcomer({ ...selectedNewcomer, notes: adminNotes || null });
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleRowClick = (newcomer: Newcomer) => {
    setSelectedNewcomer(newcomer);
    setAdminNotes(newcomer.notes || "");
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Total Visitors
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Needs Follow-up
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats.needsFollowUp}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">This Month</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats.thisMonth}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="all">All Interests</option>
            {INTEREST_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-slate-400 flex items-center">
          {filteredNewcomers.length} of {newcomers.length} records
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
              <TableRow className="hover:bg-slate-900 border-slate-800">
                <TableHead className="text-slate-300 font-semibold">
                  Name
                </TableHead>
                <TableHead className="text-slate-300 font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-slate-300 font-semibold">
                  Phone
                </TableHead>
                <TableHead className="text-slate-300 font-semibold">
                  Email
                </TableHead>
                <TableHead className="text-slate-300 font-semibold">
                  Date Registered
                </TableHead>
                <TableHead className="text-slate-300 font-semibold w-[200px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNewcomers.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-slate-400"
                  >
                    {searchQuery || statusFilter !== "all" || interestFilter !== "all"
                      ? "No newcomers found matching your filters"
                      : "No newcomers registered yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredNewcomers.map((newcomer) => (
                  <TableRow
                    key={newcomer.id}
                    className="cursor-pointer hover:bg-slate-800/50 border-slate-800 transition-colors"
                    onClick={() => handleRowClick(newcomer)}
                  >
                    <TableCell className="font-medium text-white">
                      {newcomer.full_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(
                          newcomer.status,
                        )} border font-medium`}
                      >
                        {newcomer.status || "No Status"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {newcomer.phone || "-"}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {newcomer.email || "-"}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDate(newcomer.created_at)}
                    </TableCell>
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="space-x-2"
                    >
                      <div className="flex items-center gap-2">
                        {newcomer.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${formatPhoneForLink(
                                newcomer.phone,
                              )}`;
                            }}
                            className="h-8 w-8 p-0 border-slate-700 hover:bg-slate-800"
                            title="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {newcomer.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://wa.me/${formatPhoneForLink(
                                  newcomer.phone,
                                )}`,
                                "_blank",
                              );
                            }}
                            className="h-8 w-8 p-0 border-slate-700 hover:bg-slate-800"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingStatus === newcomer.id}
                              className="h-8 border-slate-700 hover:bg-slate-800"
                            >
                              {updatingStatus === newcomer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  Status
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-slate-900 border-slate-800"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() =>
                                  handleStatusUpdate(newcomer.id, status)
                                }
                                className={
                                  newcomer.status === status
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-300 hover:bg-slate-800"
                                }
                              >
                                {status}
                                {newcomer.status === status && " ✓"}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Enhanced Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 border-slate-800">
          <SheetHeader>
            <SheetTitle className="text-white">
              {selectedNewcomer?.full_name}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Complete visitor profile and follow-up information
            </SheetDescription>
          </SheetHeader>

          {selectedNewcomer && (
            <div className="mt-6 space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-2 pb-4 border-b border-slate-800">
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
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://wa.me/${formatPhoneForLink(
                            selectedNewcomer.phone,
                          )}`,
                          "_blank",
                        )
                      }
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  </>
                )}
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-white border-b border-slate-800 pb-2">
                  Basic Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Status</p>
                    <Badge
                      className={`${getStatusColor(
                        selectedNewcomer.status,
                      )} border mt-1`}
                    >
                      {selectedNewcomer.status || "No Status"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Email</p>
                    <p className="text-base text-white">
                      {selectedNewcomer.email || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Phone</p>
                    <p className="text-base text-white">
                      {selectedNewcomer.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">
                      Marital Status
                    </p>
                    <p className="text-base text-white">
                      {selectedNewcomer.marital_status || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">
                      Age Group
                    </p>
                    <p className="text-base text-white">
                      {selectedNewcomer.age_group || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">
                      Service Time
                    </p>
                    <p className="text-base text-white">
                      {selectedNewcomer.service_time || "-"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-slate-400">
                      Address
                    </p>
                    <p className="text-base text-white">
                      {selectedNewcomer.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spiritual Journey - Parse from notes */}
              {selectedNewcomer.notes && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white border-b border-slate-800 pb-2">
                    Spiritual Journey
                  </h3>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap">
                    {selectedNewcomer.notes
                      .split(" | ")
                      .filter((note) =>
                        /born|baptis|spiritual/i.test(note),
                      )
                      .map((note, idx) => (
                        <p key={idx} className="mb-2">
                          {note}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* Career & Profession */}
              {(selectedNewcomer.occupation ||
                selectedNewcomer.interest_areas) && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white border-b border-slate-800 pb-2">
                    Career & Involvement
                  </h3>
                  {selectedNewcomer.occupation && (
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Occupation
                      </p>
                      <p className="text-base text-white">
                        {selectedNewcomer.occupation}
                      </p>
                    </div>
                  )}
                  {selectedNewcomer.interest_areas &&
                    selectedNewcomer.interest_areas.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-400 mb-2">
                          Interest Areas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedNewcomer.interest_areas.map(
                            (area, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-slate-800 text-slate-200"
                              >
                                {area}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Prayer Request */}
              {selectedNewcomer.prayer_request && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white border-b border-slate-800 pb-2">
                    Prayer Request
                  </h3>
                  <p className="text-base text-white whitespace-pre-wrap">
                    {selectedNewcomer.prayer_request}
                  </p>
                </div>
              )}

              {/* Admin Notes Section */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="font-semibold text-lg text-white">
                  Admin Notes
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="admin-notes" className="text-slate-400">
                    Follow-up comments and notes
                  </Label>
                  <textarea
                    id="admin-notes"
                    rows={6}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="flex w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Add follow-up notes, meeting details, or any other relevant information..."
                  />
                  <Button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {savingNotes ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Notes"
                    )}
                  </Button>
                </div>
              </div>

              {/* Registration Info */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-400">
                      Date Registered
                    </p>
                    <p className="text-base text-white">
                      {formatDate(selectedNewcomer.created_at)}
                    </p>
                  </div>
                  {selectedNewcomer.assigned_to && (
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Assigned To
                      </p>
                      <p className="text-base text-white">
                        {selectedNewcomer.assigned_to}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
