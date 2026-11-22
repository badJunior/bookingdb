import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";
import { Motorcycle } from "@phosphor-icons/react";
import { httpClient } from "./utils";
import { PageShell } from "./components/pageShell";
import { DeliveryStatusBadge } from "./components/statusBadge";
import { Reveal } from "./components/reveal";
import {
  formatDateTime,
  formatDistance,
  formatMoney,
  formatWindow,
  kindLabel,
  type DeliveryDto,
  type DeliveryStatus,
} from "@/lib/delivery";
import { cn } from "@/lib/utils";

const progress: DeliveryStatus[] = ["Assigned", "EnRoute", "Arrived", "Completed"];

export default function MyDeliveriesPage() {
  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ["myDeliveries"],
    queryFn: async () => {
      const response = await httpClient.get<DeliveryDto[]>("/deliveries");
      return response.data;
    },
    refetchInterval: 15000,
  });

  return (
    <PageShell
      eyebrow="Логистика"
      title="Мои доставки"
      description="Здесь видно, когда курьер назначен, в пути и когда мотоцикл доставлен или забран. Данные обновляются автоматически."
      actions={
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-lime-deep"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Обновить
        </button>
      }
    >
      {isPending && (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card/60 p-16">
          <RefreshCw className="h-5 w-5 animate-spin text-forest" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Не удалось загрузить доставки. Попробуйте обновить страницу.
        </div>
      )}

      {data && data.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime/25 text-forest animate-float-slow">
            <PackageCheck className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-xl font-bold tracking-tight">Пока нет доставок</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Оформите аренду с доставкой — и она появится здесь вместе со статусом курьера.
          </p>
          <Link
            to="/booking/available-bikes"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-forest px-5 text-sm font-semibold text-paper transition hover:bg-ink/80"
          >
            <Motorcycle className="h-4 w-4" /> Выбрать мотоцикл
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4">
          {data.map((delivery, index) => (
            <Reveal key={delivery.id} delay={index * 60}>
              <DeliveryCard delivery={delivery} />
            </Reveal>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function DeliveryCard({ delivery }: { delivery: DeliveryDto }) {
  const stepIndex = progress.indexOf(delivery.status);
  const isTerminal = delivery.status === "Completed" || delivery.status === "Cancelled" || delivery.status === "Failed";

  return (
    <article className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-lime-deep">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              delivery.kind === "Dropoff" ? "bg-ink text-lime" : "bg-clay/15 text-clay",
            )}
          >
            {delivery.kind === "Dropoff" ? <Truck className="h-5 w-5" /> : <Motorcycle className="h-5 w-5" />}
          </span>
          <div>
            <h2 className="text-base font-bold tracking-tight">{kindLabel(delivery.kind)}</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {delivery.bikeModel} · заказ #{delivery.bookingId}
            </p>
          </div>
        </div>
        <DeliveryStatusBadge status={delivery.status} />
      </div>

      <div className="mt-5 grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2 lg:grid-cols-3">
        <Info icon={MapPin} label="Адрес" value={delivery.addressLine} />
        <Info icon={Clock} label="Окно" value={formatWindow(delivery.scheduledFrom, delivery.scheduledTo)} />
        <Info
          icon={PackageCheck}
          label="Стоимость"
          value={delivery.fee > 0 ? `${formatMoney(delivery.fee)} · ${formatDistance(delivery.distanceKm)}` : "включено"}
        />
        {delivery.courierId && (
          <Info
            icon={UserRound}
            label="Курьер"
            value={`${delivery.courierName}${delivery.courierPhone ? ` · ${delivery.courierPhone}` : ""}`}
          />
        )}
        {delivery.completedAt && (
          <Info icon={CheckCircle2} label="Завершено" value={formatDateTime(delivery.completedAt)} />
        )}
      </div>

      {!isTerminal && delivery.status !== "Pending" && (
        <div className="mt-5 flex items-center gap-2">
          {progress.map((step, index) => {
            const active = index <= stepIndex;
            return (
              <div key={step} className="flex flex-1 items-center gap-2 last:flex-none">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full transition-colors",
                    active ? "bg-forest" : "bg-border",
                  )}
                />
                {index < progress.length - 1 && (
                  <span
                    className={cn(
                      "h-px flex-1 transition-colors",
                      index < stepIndex ? "bg-forest" : "bg-border",
                    )}
                  />
                )}
              </div>
            );
          })}
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            {delivery.status === "Assigned" && "курьер назначен"}
            {delivery.status === "EnRoute" && "курьер в пути"}
            {delivery.status === "Arrived" && "курьер на месте"}
          </span>
        </div>
      )}
    </article>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-xs font-medium leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

