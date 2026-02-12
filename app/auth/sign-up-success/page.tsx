import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RCCGLogo } from "@/components/rccg-logo";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <RCCGLogo size={80} showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
            RCCG Power of Jehovah
          </h1>
          <p className="text-slate-400 text-sm">Essex Church Management</p>
        </div>
        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">
              Thank you for signing up!
            </CardTitle>
            <CardDescription className="text-slate-400">
              Check your email to confirm your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
              <Mail className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white font-medium mb-1">
                  Verification email sent
                </p>
                <p className="text-sm text-slate-400">
                  We&apos;ve sent a verification link to your email address.
                  Please check your inbox and click the link to verify your
                  account before signing in.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs text-slate-500 text-center mb-4">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <Link
                  href="/auth/sign-up"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  try signing up again
                </Link>
                .
              </p>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="w-full bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
                >
                  Go to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
