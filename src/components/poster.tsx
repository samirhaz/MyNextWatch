"use client";
import Image from "next/image";
import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { cn, imageUrl } from "@/lib/utils";
export function Poster({
  path,
  title,
  className,
  backdrop = false,
  priority = false,
}: {
  path: string | null;
  title: string;
  className?: string;
  backdrop?: boolean;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = imageUrl(path, backdrop ? "w1280" : "w500");
  return (
    <div className={cn("relative overflow-hidden bg-[#202422]", className)}>
      {url && !failed ? (
        <Image
          src={url}
          alt={backdrop ? "" : `${title} poster`}
          fill
          sizes={backdrop ? "100vw" : "(max-width: 640px) 50vw, (max-width: 1100px) 30vw, 220px"}
          className="object-cover"
          unoptimized
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="film-grain absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <Clapperboard className="size-8 text-primary/60" />
          <span className="line-clamp-3 text-sm font-medium text-[#b3b9af]">{title}</span>
          <span className="text-[10px] text-muted-foreground">Poster unavailable</span>
        </div>
      )}
    </div>
  );
}
