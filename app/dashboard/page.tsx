import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Bell } from "lucide-react";
import Link from "next/link";
import { MyFollowups } from "@/components/dashboard/my-followups";
import { ProfileError } from "@/components/dashboard/profile-error";
import { DevRoleSwitcher } from "@/components/dev-role-switcher";
import { MemberDashboard } from "@/components/member/member-dashboard";
import { RCCGLogo } from "@/components/rccg-logo";

async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile, profileError };
}

export default async function DashboardPage() {
  const { user, profile, profileError } = await getUserProfile();

  // Show error UI if profile fetch failed (layout still provides header)
  if (profileError && !profile) {
    return <ProfileError error={profileError as Error} />;
  }

  return (
    <>
        {/* My Follow-ups Section */}
        <div className="mb-6">
          <MyFollowups />
        </div>

        {/* Member Dashboard - Tasks, Messages, Duties */}
        <div className="mb-6">
          <MemberDashboard />
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Upcoming Events */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <CardTitle className="text-card-foreground">Upcoming Events</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                View church events and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Check out our upcoming events and services.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard?tab=events">View Events</Link>
              </Button>
            </CardContent>
          </Card>

          {/* My Rota */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                <CardTitle className="text-card-foreground">My Rota</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                View your assigned shifts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                See your upcoming rota assignments.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard?tab=duties">View Rota</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card border-border shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                <CardTitle className="text-card-foreground">Notifications</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Stay updated with church news
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                View and manage your notifications
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/notifications">View all notifications</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info */}
        <Card className="mt-6 bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-card-foreground">Profile Information</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="text-card-foreground">{(profile as { full_name?: string | null } | null)?.full_name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-card-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-card-foreground">{(profile as { phone?: string | null } | null)?.phone || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-card-foreground capitalize">{(profile as { role?: string | null } | null)?.role || "member"}</p>
            </div>
            <DevRoleSwitcher
              email={user.email || ""}
              currentRole={
                (((profile as { role?: string | null } | null)?.role ||
                  "member") as "admin" | "member")
              }
            />
          </CardContent>
        </Card>
    </>
  );
}

