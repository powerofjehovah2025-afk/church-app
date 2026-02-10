"use client";

import { MemberDetailView } from "@/components/admin/member-detail-view";

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  return <MemberDetailView params={params} />;
}

