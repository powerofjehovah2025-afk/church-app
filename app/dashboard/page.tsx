import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Users, Bell } from "lucide-react";
import Link from "next/link";
import { MyFollowups } from "@/components/dashboard/my-followups";
import { ProfileError } from "@/components/dashboard/profile-error";
import { DevRoleSwitcher } from "@/components/dev-role-switcher";

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

async function handleLogout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function DashboardPage() {
  const { user, profile, profileError } = await getUserProfile();

  // Show error UI if profile fetch failed
  if (profileError && !profile) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-foreground">
        <div className="mx-auto max-w-7xl p-6 pb-24">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-400 mt-2 text-lg">
                Your church dashboard
              </p>
            </div>
            <form action={handleLogout}>
              <Button
                type="submit"
                variant="outline"
                className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
          <ProfileError error={profileError as Error} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-7xl p-6 pb-24">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Welcome, {(profile as { full_name?: string | null } | null)?.full_name || user.email?.split("@")[0] || "Member"}!
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Your church dashboard
            </p>
          </div>
          <form action={handleLogout}>
            <Button
              type="submit"
              variant="outline"
              className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </form>
        </div>

        {/* My Follow-ups Section */}
        <div className="mb-6">
          <MyFollowups />
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Upcoming Events */}
          <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white">Upcoming Events</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                View church events and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm mb-4">
                Check out our upcoming events and services.
              </p>
              <Button
                variant="outline"
                className="w-full bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
                asChild
              >
                <Link href="/events">View Events</Link>
              </Button>
            </CardContent>
          </Card>

          {/* My Rota */}
          <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">My Rota</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                View your assigned shifts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm mb-4">
                See your upcoming rota assignments.
              </p>
              <Button
                variant="outline"
                className="w-full bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
                asChild
              >
                <Link href="/rota">View Rota</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-white">Notifications</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Stay updated with church news
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm mb-4">
                You&apos;re all caught up!
              </p>
              <Button
                variant="outline"
                className="w-full bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
                disabled
              >
                No New Notifications
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info */}
        <Card className="mt-6 bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Profile Information</CardTitle>
            <CardDescription className="text-slate-400">
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Full Name</p>
              <p className="text-white">{(profile as { full_name?: string | null } | null)?.full_name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Role</p>
              <p className="text-white capitalize">{(profile as { role?: string | null } | null)?.role || "member"}</p>
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
      </div>
    </div>
  );
}

