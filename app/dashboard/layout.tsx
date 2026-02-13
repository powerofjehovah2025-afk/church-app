import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { RCCGLogo } from "@/components/rccg-logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DashboardBackLink } from "@/components/dashboard/dashboard-back-link";

async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

async function handleLogout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getUserProfile();
  const displayName =
    (profile as { full_name?: string | null } | null)?.full_name ||
    user.email?.split("@")[0] ||
    "Member";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-24">
        {/* Shared header */}
        <header className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 sm:mb-3 flex items-center gap-3 flex-wrap">
              <Link href="/dashboard" className="flex items-center gap-2">
                <RCCGLogo size={40} showText={false} />
              </Link>
              <DashboardBackLink />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Welcome, {displayName}!
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-lg">
              Your church dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <form action={handleLogout}>
              <Button type="submit" variant="outline" className="min-h-[44px]">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
