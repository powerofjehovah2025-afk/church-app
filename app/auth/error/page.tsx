import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { RCCGLogo } from "@/components/rccg-logo";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {params.error}
          </p>
          <div className="pt-4">
            <Link href="/auth/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-300">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
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
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              Sorry, something went wrong.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense>
              <ErrorContent searchParams={searchParams} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
