"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RCCGLogoIconProps {
  size?: number;
  className?: string;
}

interface RCCGLogoProps extends RCCGLogoIconProps {
  showText?: boolean;
}

export function RCCGLogoIcon({ size = 32, className }: RCCGLogoIconProps) {
  const dimension = `${size}px`;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-emerald-400 to-teal-500 border border-white/30 shadow-md",
        className,
      )}
      style={{ width: dimension, height: dimension }}
      aria-hidden="true"
    >
      <span className="text-[0.6rem] font-bold tracking-tight text-white">
        RCCG
      </span>
    </div>
  );
}

export function RCCGLogo({
  size = 40,
  showText = true,
  className,
}: RCCGLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RCCGLogoIcon size={size} />
      {showText && (
        <div className="leading-tight">
          <div className="text-xs font-semibold uppercase text-slate-200">
            RCCG
          </div>
          <div className="text-sm font-bold text-white">
            Power of Jehovah Parish
          </div>
          <div className="text-[0.65rem] text-slate-400">
            Essex Church Management
          </div>
        </div>
      )}
    </div>
  );
}

export default RCCGLogo;

