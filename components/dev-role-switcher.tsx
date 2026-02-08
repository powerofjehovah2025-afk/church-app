"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type DevRoleSwitcherProps = {
  email: string;
  currentRole: "admin" | "member";
};

export function DevRoleSwitcher({
  email,
  currentRole,
}: DevRoleSwitcherProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const devEnabled = process.env.NEXT_PUBLIC_DEV_ROLE_SWITCHER === "true";
  const allowedEmails = useMemo(() => {
    return (process.env.NEXT_PUBLIC_DEV_ROLE_SWITCHER_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  if (!devEnabled || !email || !allowedEmails.includes(email.toLowerCase())) {
    return null;
  }

  const nextRole = currentRole === "admin" ? "member" : "admin";

  const handleSwitch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dev/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to switch role");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to switch role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-700/50 p-3 text-sm">
      <p className="text-slate-400 mb-2">
        Dev Role Switcher (your account only)
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={handleSwitch}
        className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
      >
        {isLoading ? "Switching..." : `Switch to ${nextRole}`}
      </Button>
    </div>
  );
}





