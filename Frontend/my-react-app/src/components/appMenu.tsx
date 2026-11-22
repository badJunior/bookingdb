import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  LayoutGrid,
  LogOut,
  Menu,
  PackageCheck,
  ShieldCheck,
  Tag,
  Truck,
  UserRound,
} from "lucide-react";
import { Motorcycle } from "@phosphor-icons/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRole } from "./roleContext";
import { cn } from "@/lib/utils";

type MenuLink = {
  to: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const rentalLinks: MenuLink[] = [
  {
    to: "/booking/available-bikes",
    label: "Аренда",
    hint: "Свободные мотоциклы и бронирование",
    icon: Motorcycle,
  },
  {
    to: "/my-bookings",
    label: "Мои аренды",
    hint: "Фото, чек и статус аренды",
    icon: ClipboardCheck,
  },
  {
    to: "/my-deliveries",
    label: "Мои доставки",
    hint: "Статусы доставки и забора",
    icon: PackageCheck,
  },
];

const catalogLinks: MenuLink[] = [
  {
    to: "/models",
    label: "Модели",
    hint: "Каталог моделей мотоциклов",
    icon: LayoutGrid,
  },
  {
    to: "/categories",
    label: "Категории",
    hint: "Классы и назначение",
    icon: Tag,
  },
  {
    to: "/bikes",
    label: "Мотоциклы",
    hint: "Весь парк техники",
    icon: Boxes,
  },
];

export default function AppMenu() {
  const { role, username } = useRole();
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem("token");

  if (!token) return null;

  const links: MenuLink[] =
    role === "Courier"
      ? [
          {
            to: "/courier",
            label: "Мои доставки",
            hint: "Смена, геолокация и заказы",
            icon: Truck,
          },
        ]
      : role === "Admin"
        ? [
            ...rentalLinks,
            {
              to: "/admin/deliveries",
              label: "Доставки",
              hint: "Курьеры, карта и назначение",
              icon: ShieldCheck,
            },
            {
              to: "/admin/rentals",
              label: "Аренды",
              hint: "Чеки и фото до/после",
              icon: ClipboardCheck,
            },
            ...catalogLinks,
          ]
        : rentalLinks;

  const roleLabel =
    role === "Admin" ? "Администратор" : role === "Courier" ? "Курьер" : "Клиент";

  const logout = () => {
    ["token", "role", "username", "email", "courierApproved"].forEach((key) =>
      localStorage.removeItem(key),
    );
    window.location.href = "/login";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Открыть меню"
          className="group fixed right-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-lime-deep active:translate-y-0 sm:right-6 sm:top-6"
        >
          <Menu className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </SheetTrigger>

      <SheetContent className="px-0">
        <SheetHeader className="relative border-b border-white/10 px-6 pb-6 pt-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime text-ink">
              <Motorcycle className="h-5 w-5" />
            </span>
            <div>
              <SheetTitle className="text-left font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-paper">
                Bikebooking
              </SheetTitle>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">
                Омск · доставка мотоциклов
              </p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 px-6 py-4">
          {links.map((link, index) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${80 + index * 70}ms` }}
                className="group flex animate-reveal items-center gap-4 border-b border-white/10 py-5 transition-colors hover:border-lime/40"
              >
                <span className="font-mono text-[10px] font-bold text-paper/25 transition-colors group-hover:text-lime">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-paper/60 transition-all duration-300 group-hover:bg-lime group-hover:text-ink">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold tracking-tight text-paper transition-transform duration-300 group-hover:translate-x-1">
                    {link.label}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wider text-paper/35">
                    {link.hint}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-paper/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime" />
              </Link>
            );
          })}

          <Link
            to="/register/courier"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-paper/30 transition-colors hover:text-lime"
          >
            <span className="h-px w-6 bg-current" />
            Стать курьером
          </Link>
        </nav>

        <div className="mt-auto border-t border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lime">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-paper">{username}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/40">
                {roleLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-paper/50 transition hover:border-clay/50 hover:bg-clay/15 hover:text-clay"
              aria-label="Выйти"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <span className="pointer-events-none absolute -bottom-10 left-0 select-none font-mono text-[120px] font-black leading-none text-white/[0.03]">
          BIKE
        </span>
      </SheetContent>
    </Sheet>
  );
}

export function RolePill({ role, className }: { role: string; className?: string }) {
  const tone =
    role === "Admin"
      ? "bg-clay/10 text-clay border-clay/20"
      : role === "Courier"
        ? "bg-lime/30 text-forest border-lime-deep/40"
        : "bg-ink/5 text-ink border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em]",
        tone,
        className,
      )}
    >
      {role === "Admin" ? "Admin" : role === "Courier" ? "Courier" : "Client"}
    </span>
  );
}
