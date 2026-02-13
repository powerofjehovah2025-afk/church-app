"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  const showPages = (() => {
    const pages: (number | "ellipsis")[] = [];
    const show = 3;
    if (totalPages <= show + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const lo = Math.max(2, currentPage - 1);
      const hi = Math.min(totalPages - 1, currentPage + 1);
      if (lo > 2) pages.push("ellipsis");
      for (let i = lo; i <= hi; i++) if (i !== 1 && i !== totalPages) pages.push(i);
      if (hi < totalPages - 1) pages.push("ellipsis");
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  })();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 py-4",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {totalCount}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-9 min-w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {showPages.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e-${i}`} className="px-2 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={currentPage === p ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p)}
                className="h-9 min-w-9"
              >
                {p}
              </Button>
            )
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-9 min-w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
