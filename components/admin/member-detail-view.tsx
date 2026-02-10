"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, User, CheckSquare, Calendar, Mail, Users, Activity } from "lucide-react";
import type { Profile, Task, Message } from "@/types/database.types";

interface MemberDetailData {
  profile: Profile;
  tasks: Task[];
  duties: Array<{ id: string; status: string; service: { id: string; date: string; name: string; time: string | null } | null; duty_type: { id: string; name: string } | null }>;
  messages: Message[];
  newcomers: Array<{ id: string; full_name: string; email: string | null; phone: string | null; status: string | null; followup_status: string | null }>;
}

export function MemberDetailView({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [data, setData] = useState<MemberDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setMemberId(p.memberId));
  }, [params]);

  useEffect(() => {
    if (!memberId) return;

    const fetchMemberData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/members/${memberId}`);
        if (response.ok) {
          const memberData = await response.json();
          setData(memberData);
        } else {
          console.error("Failed to fetch member data");
        }
      } catch (error) {
        console.error("Error fetching member data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberData();
  }, [memberId]);

  const getRoleColor = (role: string | null) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      pastor: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      elder: "bg-green-500/20 text-green-300 border-green-500/50",
      deacon: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      leader: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      member: "bg-slate-500/20 text-slate-300 border-slate-500/50",
    };
    return colors[role || ""] || colors.member;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      completed: "bg-green-500/20 text-green-300 border-green-500/50",
      cancelled: "bg-red-500/20 text-red-300 border-red-500/50",
      confirmed: "bg-green-500/20 text-green-300 border-green-500/50",
      declined: "bg-red-500/20 text-red-300 border-red-500/50",
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

  if (!data) {
    return (
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardContent className="pt-6">
          <p className="text-slate-400">Member not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/users")}
          className="border-slate-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {data.profile.full_name || "Member Details"}
          </h1>
          <p className="text-slate-400">{data.profile.email}</p>
        </div>
      </div>

      {/* Member Info Card */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-slate-400" />
              <div>
                <CardTitle className="text-white">
                  {data.profile.full_name || "No name"}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {data.profile.email}
                </CardDescription>
              </div>
            </div>
            <Badge className={getRoleColor(data.profile.role)}>
              {data.profile.role || "member"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400">Phone</p>
              <p className="text-sm text-white">{data.profile.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Role</p>
              <p className="text-sm text-white">{data.profile.role || "member"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tasks</p>
              <p className="text-sm text-white">{data.tasks.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Duties</p>
              <p className="text-sm text-white">{data.duties.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
              <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="duties" className="data-[state=active]:bg-blue-600">
                <Calendar className="h-4 w-4 mr-2" />
                Duties ({data.duties.length})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks ({data.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-blue-600">
                <Mail className="h-4 w-4 mr-2" />
                Messages ({data.messages.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600">
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">Skills</h3>
                  {data.profile.skills && data.profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(data.profile.skills as string[]).map((skill, index) => (
                        <Badge key={index} className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No skills listed</p>
                  )}
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Availability</h3>
                  {data.profile.availability && Object.keys(data.profile.availability).length > 0 ? (
                    <div className="bg-slate-800/50 rounded p-3">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                        {JSON.stringify(data.profile.availability, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No availability set</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Duties Tab */}
            <TabsContent value="duties" className="mt-4">
              {data.duties.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No duties assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.duties.map((duty: { id: string; status: string; service: { id: string; date: string; name: string; time: string | null } | null; duty_type: { id: string; name: string } | null }) => (
                    <div
                      key={duty.id}
                      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-medium">
                            {duty.service?.name || "Service"}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {duty.duty_type?.name || "Duty"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {duty.service?.date && new Date(duty.service.date).toLocaleDateString()}
                            {duty.service?.time && ` • ${duty.service.time}`}
                          </p>
                        </div>
                        <Badge className={getStatusColor(duty.status || "pending")}>
                          {duty.status || "pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-4">
              {data.tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No tasks assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-medium">{task.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {task.due_date && `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="mt-4">
              {data.messages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.messages.map((message: Message) => {
                    const isSender = message.sender?.id === memberId;
                    return (
                      <div
                        key={message.id}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{message.subject}</h4>
                            <p className="text-sm text-slate-300 mt-1">{message.body}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {isSender ? "To: " : "From: "}
                              {isSender
                                ? message.recipient?.full_name || message.recipient?.email
                                : message.sender?.full_name || message.sender?.email}
                              {" • "}
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!message.is_read && !isSender && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-3">Recent Follow-ups</h3>
                  {data.newcomers.length === 0 ? (
                    <p className="text-slate-400 text-sm">No follow-ups assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {data.newcomers.map((newcomer: { id: string; full_name: string; email: string | null; phone: string | null; status: string | null; followup_status: string | null }) => (
                        <div
                          key={newcomer.id}
                          className="p-3 rounded bg-slate-800/50 border border-slate-700/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm">{newcomer.full_name}</p>
                              <p className="text-xs text-slate-400">
                                {newcomer.followup_status || "Not started"}
                              </p>
                            </div>
                            <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/50">
                              {newcomer.status || "New"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">Task Activity</h3>
                  {data.tasks.length === 0 ? (
                    <p className="text-slate-400 text-sm">No recent task activity</p>
                  ) : (
                    <div className="space-y-2">
                      {data.tasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded bg-slate-800/50 border border-slate-700/50"
                        >
                          <p className="text-white text-sm">{task.title}</p>
                          <p className="text-xs text-slate-400">
                            Status: {task.status} • Created:{" "}
                            {new Date(task.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

