import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewcomersKanban } from "@/components/admin/newcomers-kanban";
import type { Newcomer } from "@/types/database.types";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function getNewcomers(): Promise<Newcomer[]> {
  const supabase = await createClient();

  // Check if user is authenticated (you can add role checking here)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all newcomers, sorted by created_at (newest first)
  const { data, error } = await supabase
    .from("newcomers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching newcomers:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return [];
  }

  console.log(`Fetched ${data?.length || 0} newcomers from database`);
  return data || [];
}

async function NewcomersData() {
  const newcomers = await getNewcomers();
  return <NewcomersKanban initialData={newcomers} />;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
        <p className="text-slate-400">Loading Ministry Growth Center...</p>
      </div>
    </div>
  );
}

export default function AdminNewcomersPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-7xl p-6 pb-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Ministry Growth Center
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Track souls, manage engagement, and celebrate growth
          </p>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <NewcomersData />
        </Suspense>
      </div>
    </div>
  );
}
