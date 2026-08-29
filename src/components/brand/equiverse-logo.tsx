import Image from "next/image";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type EquiverseLogoProps = {
  className?: string;
  compact?: boolean;
  priority?: boolean;
};

export function EquiverseLogo({ className, compact = false, priority = false }: EquiverseLogoProps) {
  return (
    <Image
      alt={BRAND.name}
      className={cn("block h-auto w-auto object-contain", className)}
      height={compact ? 56 : 60}
      priority={priority}
      src={compact ? BRAND.mark : BRAND.logo}
      width={compact ? 56 : 288}
    />
  );
}
