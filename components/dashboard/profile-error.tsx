"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileErrorProps {
  error: Error | null;
}

export function ProfileError({ error }: ProfileErrorProps) {
  const router = useRouter();

  const handleRetry = () => {
    router.refresh();
  };

  return (
    <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <CardTitle className="text-white">Profile Error</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          Unable to load your profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
          <p className="text-sm text-amber-300">
            {error?.message || "An error occurred while fetching your profile. Please try again."}
          </p>
        </div>
        <Button
          onClick={handleRetry}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}


