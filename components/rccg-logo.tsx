import Image from "next/image";

interface RCCGLogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function RCCGLogo({ className = "", showText = true, size = 50 }: RCCGLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src="/logo.png"
          alt="RCCG Power of Jehovah Logo"
          fill
          className="object-contain"
          priority
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
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/logo.png"
        alt="RCCG Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}

