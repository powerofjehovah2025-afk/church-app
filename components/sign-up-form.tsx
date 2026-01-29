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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chrome } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const validateInvitationCode = async (code: string) => {
    if (!code.trim()) {
      setCodeValid(null);
      return;
    }

    setValidatingCode(true);
    try {
      const response = await fetch("/api/invitation-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await response.json();
      setCodeValid(data.valid);
      if (!data.valid) {
        setError(data.error || "Invalid invitation code");
      } else {
        setError(null);
      }
    } catch (error) {
      setCodeValid(false);
      setError("Failed to validate invitation code");
    } finally {
      setValidatingCode(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setInvitationCode(code);
    setError(null);
    setCodeValid(null);
    
    // Validate code when user stops typing (debounce)
    if (code.length >= 4) {
      const timeoutId = setTimeout(() => {
        validateInvitationCode(code);
      }, 500);
      
      // Cleanup function will be handled by useEffect if needed
      // For now, we'll let the timeout run
    } else if (code.length === 0) {
      setCodeValid(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Validate invitation code first
    if (!invitationCode.trim()) {
      setError("Invitation code is required");
      setIsLoading(false);
      return;
    }

    if (codeValid === false) {
      setError("Please enter a valid invitation code");
      setIsLoading(false);
      return;
    }

    // Re-validate code before signup
    const validationResponse = await fetch("/api/invitation-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: invitationCode.trim().toUpperCase() }),
    });

    const validationData = await validationResponse.json();
    if (!validationData.valid) {
      setError(validationData.error || "Invalid invitation code");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            full_name: fullName,
            invitation_code: invitationCode.trim().toUpperCase(),
            invitation_code_id: validationData.codeId,
          },
        },
      });

      if (signUpError) throw signUpError;

      // If user is created, create profile record and record code usage
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          // @ts-expect-error - Supabase type inference issue, but this works at runtime
          .insert({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            role: "member", // Default role
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Don't throw - the user is created, profile can be created later
        }

        // Record invitation code usage (using admin client to bypass RLS)
        try {
          await fetch("/api/invitation-codes/use", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              codeId: validationData.codeId,
              userId: authData.user.id,
            }),
          });
        } catch (err) {
          console.error("Error recording code usage:", err);
          // Don't fail signup if usage recording fails
        }
      }

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // For Google OAuth, we need an invitation code first
    // Since OAuth redirects, we'll validate the code first
    if (!invitationCode.trim()) {
      setError("Please enter an invitation code before signing up with Google");
      return;
    }

    // Validate code before proceeding
    const validationResponse = await fetch("/api/invitation-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: invitationCode.trim().toUpperCase() }),
    });

    const validationData = await validationResponse.json();
    if (!validationData.valid) {
      setError(validationData.error || "Invalid invitation code");
      return;
    }

    // Store code in sessionStorage for use after OAuth redirect
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pending_invitation_code", invitationCode.trim().toUpperCase());
      sessionStorage.setItem("pending_invitation_code_id", validationData.codeId);
    }

    const supabase = createClient();
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (googleError) throw googleError;
      // The redirect will happen automatically
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to sign up with Google");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Sign up</CardTitle>
          <CardDescription className="text-slate-400">Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invitationCode" className="text-slate-300">
                  Invitation Code <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="Enter your invitation code"
                  required
                  value={invitationCode}
                  onChange={handleCodeChange}
                  className={`bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-500 ${
                    codeValid === true
                      ? "border-green-500"
                      : codeValid === false
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {validatingCode && (
                  <p className="text-xs text-slate-400">Validating code...</p>
                )}
                {codeValid === true && (
                  <p className="text-xs text-green-400">✓ Valid invitation code</p>
                )}
                {codeValid === false && invitationCode.length >= 4 && (
                  <p className="text-xs text-red-400">Invalid or expired code</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password" className="text-slate-300">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>
              {error && <p className="text-sm text-[#ef4444]">{error}</p>}
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" 
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900/40 px-2 text-slate-400">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignUp}
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-white/5 border-slate-700/50 hover:bg-white/10 text-white"
              >
                {isGoogleLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing up...
                  </>
                ) : (
                  <>
                    <Chrome className="h-4 w-4 mr-2" />
                    Staff Sign up with Google
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-slate-300 underline underline-offset-4 hover:text-white">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
