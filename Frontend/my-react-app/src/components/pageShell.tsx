import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className="relative min-h-screen px-4 pb-20 pt-24 sm:px-6 lg:px-10">
      <div className={cn("mx-auto w-full max-w-6xl space-y-10", className)}>
        <header className="animate-reveal border-b-2 border-border pb-8">
          {eyebrow && (
            <div className="mb-4 flex items-center gap-3">
              <span className="h-1 w-10 bg-forest" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-forest">
                {eyebrow}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-balance text-4xl font-black leading-[0.92] tracking-[-0.03em] text-ink sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              {description && (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
          </div>
        </header>

        <div className="animate-fade-soft">{children}</div>
      </div>
    </div>
  );
}
