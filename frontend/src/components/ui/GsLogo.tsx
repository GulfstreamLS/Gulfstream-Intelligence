"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "../../lib/utils";

interface GsLogoProps {
  variant?: "default" | "light";
  className?: string;
  iconSize?: number;
}

export function GsLogo({ variant = "default", className, iconSize = 44 }: GsLogoProps) {
  const wordmarkClass =
    variant === "light" ? "text-white" : "text-gs-text";

  return (
    <Link href="/" className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <WaveIcon size={iconSize} />

      <div className={cn("leading-[1.08] uppercase", wordmarkClass)}>
        <p className="text-[14px] font-extrabold tracking-[0.16em] sm:text-[15px]">
          Gulfstream
        </p>
        <p className="text-[13px] font-extrabold tracking-[0.16em] sm:text-[14px]">
          Intelligence
        </p>
      </div>
    </Link>
  );
}

export function WaveIcon({ size }: { size?: number }) {
  const width = size&&Math.round(size * 1.08);
  const height = size&&Math.round(size * 0.72);

  return (
   <Image src={"/images/FullLogo_NoBuffer.png"} alt="GulfStream Logo" width={width ?? 48} height={height ?? 32} />
  );
}
