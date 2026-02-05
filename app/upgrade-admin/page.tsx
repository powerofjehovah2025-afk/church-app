"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";

export default function UpgradeAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/upgrade-to-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upgrade account");
      }

      setSuccess(true);
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        router.push("/admin/newcomers");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-white">Upgrade to Admin</CardTitle>
          <CardDescription className="text-slate-400">
            Upgrade your account to administrator privileges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-green-500/20 p-4 text-green-300">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Account Upgraded Successfully!</p>
                  <p className="text-sm text-green-300/80">
                    Redirecting to admin dashboard...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-sm text-slate-300 mb-2">
                  <strong className="text-white">What this does:</strong>
                </p>
                <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Upgrades your account role to &quot;admin&quot;</li>
                  <li>Grants access to admin dashboard</li>
                  <li>Enables full administrative privileges</li>
                </ul>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-lg bg-red-500/20 p-4 text-red-300">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">Upgrading...</span>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </>
                ) : (
                  "Upgrade to Admin"
                )}
              </Button>

              <p className="text-xs text-center text-slate-500">
                Make sure you are logged in before upgrading
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


