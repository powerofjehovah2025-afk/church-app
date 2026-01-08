"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Fetch user profile to determine redirect based on role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        // Redirect based on role
        if (profile?.role === "admin") {
          router.push("/admin/newcomers");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Reset Your Password</CardTitle>
          <CardDescription className="text-slate-400">
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-slate-300">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>
              {error && <p className="text-sm text-[#ef4444]">{error}</p>}
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" 
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save new password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
