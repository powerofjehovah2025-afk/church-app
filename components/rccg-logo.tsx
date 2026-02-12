"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import churchLogo from "@/assets/church-logo-poje.png";

interface RCCGLogoIconProps {
  size?: number;
  className?: string;
}

interface RCCGLogoProps extends RCCGLogoIconProps {
  showText?: boolean;
}

export function RCCGLogoIcon({ size = 32, className }: RCCGLogoIconProps) {
  const dimension = size;

  return (
    <Image
      src={churchLogo}
      alt="RCCG Power of Jehovah logo"
      width={dimension}
      height={dimension}
      className={cn("object-contain", className)}
      priority
    />
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

