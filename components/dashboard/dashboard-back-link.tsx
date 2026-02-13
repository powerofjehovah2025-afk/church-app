"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function DashboardBackLink() {
  const pathname = usePathname();
  if (pathname === "/dashboard") return null;

  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to dashboard
    </Link>
  );
}
