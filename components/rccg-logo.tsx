"use client";

import { useState } from "react";
import Image from "next/image";

// Try to load the logo, fallback to SVG if PNG doesn't exist
const LOGO_SRC = "/logo.png";
const LOGO_SVG_FALLBACK = "/logo.svg";

interface RCCGLogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function RCCGLogo({ className = "", showText = true, size = 50 }: RCCGLogoProps) {
  const [imgSrc, setImgSrc] = useState(LOGO_SRC);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <img
          src={imgSrc}
          alt="RCCG Power of Jehovah Logo"
          className="object-contain w-full h-full"
          onError={() => {
            // Fallback to SVG if PNG doesn't exist
            if (imgSrc !== LOGO_SVG_FALLBACK) {
              setImgSrc(LOGO_SVG_FALLBACK);
            }
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-white font-bold text-lg leading-tight">
            POWER OF JEHOVAH
          </span>
          <span className="text-slate-400 text-xs">
            RCCG Essex
          </span>
        </div>
      )}
    </div>
  );
}

export function RCCGLogoIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  const [imgSrc, setImgSrc] = useState(LOGO_SRC);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <img
        src={imgSrc}
        alt="RCCG Logo"
        className="object-contain w-full h-full"
        onError={() => {
          // Fallback to SVG if PNG doesn't exist
          if (imgSrc !== LOGO_SVG_FALLBACK) {
            setImgSrc(LOGO_SVG_FALLBACK);
          }
        }}
      />
    </div>
  );
}

