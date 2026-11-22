import { Motorcycle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type BikeImageProps = {
  src?: string | null;
  alt: string;
  badge?: string;
  className?: string;
};

/**
 * Catalog image frame with a fixed 4:3 ratio. Images are never cropped:
 * object-contain keeps the whole motorcycle visible on a neutral background.
 */
export function BikeImage({ src, alt, badge, className }: BikeImageProps) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden border-b border-border bg-[#f4f6ef]",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground/70">
          <Motorcycle className="h-10 w-10" />
        </div>
      )}

      {badge && (
        <span className="absolute left-3 top-3 rounded-full bg-ink/90 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-lime">
          {badge}
        </span>
      )}
    </div>
  );
}
