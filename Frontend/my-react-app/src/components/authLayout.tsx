import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin, Route, ShieldCheck, Timer } from "lucide-react";
import { Motorcycle } from "@phosphor-icons/react";

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink">
            <Motorcycle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em]">
              Bikebooking
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/40">
              Омск · прокат мотоциклов
            </p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 border border-lime/40 bg-lime/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-lime">
            <MapPin className="h-3 w-3" /> Волочаевская 17
          </span>
          <h2 className="mt-6 text-balance text-5xl font-black leading-[0.92] tracking-[-0.03em]">
            Мотоцикл у двери
            <br />
            <span className="text-lime">за пару кликов.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/55">
            Выберите мотоцикл, окно доставки и адрес — остальное система сделает сама:
            найдёт ближайшего свободного курьера и вернёт технику после аренды.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
          <Stat icon={Timer} label="30–60 мин" hint="средняя доставка" />
          <Stat icon={Route} label="до 30 км" hint="радиус сервиса" />
          <Stat icon={ShieldCheck} label="24/7" hint="онлайн-брони" />
        </div>
      </aside>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
        <div className="relative w-full max-w-md animate-reveal">
          <Link to="/" className="mb-10 inline-flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime text-ink">
              <Motorcycle className="h-5 w-5" />
            </span>            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-ink">
              Bikebooking
            </span>
          </Link>

          <div className="mb-8">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
              {eyebrow}
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/90 p-6 sm:p-8">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-xs text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  hint,
}: {
  icon: typeof Timer;
  label: string;
  hint: string;
}) {
  return (
    <div>
      <Icon className="h-4 w-4 text-lime" />
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35">
        {hint}
      </p>
    </div>
  );
}
