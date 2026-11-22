import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clock,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { Motorcycle } from "@phosphor-icons/react";
import { httpClient } from "./utils";
import { PageShell } from "./components/pageShell";
import DeliveryMap from "./components/deliveryMap";
import { CourierStatusBadge, DeliveryStatusBadge } from "./components/statusBadge";
import { Reveal } from "./components/reveal";
import {
  formatMoney,
  formatWindow,
  kindLabel,
  terminalStatuses,
  type CourierDto,
  type DeliveryDto,
  type DeliveryOptionsDto,
} from "@/lib/delivery";
import { cn } from "@/lib/utils";

export default function AdminDeliveriesPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const deliveriesQuery = useQuery({
    queryKey: ["adminDeliveries"],
    queryFn: async () => {
      const response = await httpClient.get<DeliveryDto[]>("/deliveries");
      return response.data;
    },
    refetchInterval: 15000,
  });

  const couriersQuery = useQuery({
    queryKey: ["adminCouriers"],
    queryFn: async () => {
      const response = await httpClient.get<CourierDto[]>("/couriers");
      return response.data;
    },
    refetchInterval: 20000,
  });

  const optionsQuery = useQuery({
    queryKey: ["deliveryOptions"],
    queryFn: async () => {
      const response = await httpClient.get<DeliveryOptionsDto>("/deliveries/options");
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const deliveries = deliveriesQuery.data ?? [];
  const couriers = couriersQuery.data ?? [];
  const pendingCouriers = couriers.filter((courier) => !courier.isApproved);
  const approvedCouriers = couriers.filter((courier) => courier.isApproved);
  const activeDeliveries = deliveries.filter(
    (delivery) => !terminalStatuses.includes(delivery.status),
  );
  const unassigned = activeDeliveries.filter((delivery) => !delivery.courierId);
  const onlineCouriers = approvedCouriers.filter(
    (courier) => courier.status !== "Offline",
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["adminDeliveries"] });
    queryClient.invalidateQueries({ queryKey: ["adminCouriers"] });
  };

  const approveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      if (action === "approve") {
        await httpClient.post(`/couriers/${id}/approve`);
      } else {
        await httpClient.post(`/couriers/${id}/reject`);
      }
    },
    onSuccess: invalidateAll,
    onError: (error: any) =>
      setMessage(error.response?.data?.error || "Не удалось обновить курьера."),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ deliveryId, courierId }: { deliveryId: number; courierId: number }) => {
      const response = await httpClient.post<DeliveryDto>(
        `/deliveries/${deliveryId}/assign`,
        { courierId },
      );
      return response.data;
    },
    onSuccess: () => {
      setMessage("");
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ["courierDeliveries"] });
    },
    onError: (error: any) =>
      setMessage(error.response?.data?.error || "Не удалось назначить курьера."),
  });

  const cancelMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      await httpClient.post(`/deliveries/${deliveryId}/status`, { status: "Cancelled" });
    },
    onSuccess: invalidateAll,
    onError: (error: any) =>
      setMessage(error.response?.data?.error || "Не удалось отменить доставку."),
  });

  const mapCenter: [number, number] = optionsQuery.data
    ? [optionsQuery.data.mapCenterLatitude, optionsQuery.data.mapCenterLongitude]
    : [54.9885, 73.3242];

  const markers = useMemo(() => {
    const list = [];

    if (optionsQuery.data) {
      list.push({
        id: "shop",
        lat: optionsQuery.data.shopLatitude,
        lng: optionsQuery.data.shopLongitude,
        label: "Пункт выдачи",
        tone: "shop" as const,
      });
    }

    approvedCouriers.forEach((courier) => {
      if (courier.latitude != null && courier.longitude != null) {
        list.push({
          id: `courier-${courier.id}`,
          lat: courier.latitude,
          lng: courier.longitude,
          label: `Курьер ${courier.username} (${courier.status})`,
          tone: "courier" as const,
        });
      }
    });

    activeDeliveries.forEach((delivery) => {
      list.push({
        id: `delivery-${delivery.id}`,
        lat: delivery.latitude,
        lng: delivery.longitude,
        label: `${kindLabel(delivery.kind)} · ${delivery.addressLine}`,
        tone: delivery.kind === "Dropoff" ? ("dropoff" as const) : ("pickup" as const),
      });
    });

    return list;
  }, [optionsQuery.data, approvedCouriers, activeDeliveries]);

  return (
    <PageShell
      eyebrow="Логистика"
      title="Доставки и курьеры"
      description="Автоназначение работает само, но здесь можно одобрить курьера, увидеть картину на карте и вмешаться вручную."
      actions={
        <button
          type="button"
          onClick={() => {
            deliveriesQuery.refetch();
            couriersQuery.refetch();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-lime-deep"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5",
              (deliveriesQuery.isFetching || couriersQuery.isFetching) && "animate-spin",
            )}
          />
          Обновить
        </button>
      }
    >
      {message && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Truck}
          label="Активные доставки"
          value={String(activeDeliveries.length)}
          hint={`${unassigned.length} без курьера`}
        />
        <StatCard
          icon={MapPin}
          label="Курьеры на линии"
          value={String(onlineCouriers.length)}
          hint={`${approvedCouriers.length} одобрено`}
        />
        <StatCard
          icon={ShieldCheck}
          label="Заявки курьеров"
          value={String(pendingCouriers.length)}
          hint="ожидают проверки"
        />
      </div>

      {pendingCouriers.length > 0 && (
        <section className="rounded-2xl border border-clay/20 bg-clay/5 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
            <ShieldCheck className="h-4 w-4 text-clay" /> Заявки на курьера
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pendingCouriers.map((courier) => (
              <div
                key={courier.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay/10 text-clay">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{courier.username}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {courier.phone} · {courier.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => approveMutation.mutate({ id: courier.id, action: "approve" })}
                    disabled={approveMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-lime transition hover:bg-ink/80 disabled:opacity-50"
                    aria-label="Одобрить"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => approveMutation.mutate({ id: courier.id, action: "reject" })}
                    disabled={approveMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    aria-label="Отклонить"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Активные доставки
          </h2>

          {activeDeliveries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
              <PackageCheck className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Активных доставок нет</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Новые заказы появятся здесь после оплаты.
              </p>
            </div>
          )}

          {activeDeliveries.map((delivery, index) => (
            <Reveal key={delivery.id} delay={index * 50}>
              <AdminDeliveryCard
                delivery={delivery}
                couriers={approvedCouriers}
                assigning={assignMutation.isPending}
                cancelling={cancelMutation.isPending}
                onAssign={(courierId) =>
                  assignMutation.mutate({ deliveryId: delivery.id, courierId })
                }
                onCancel={() => cancelMutation.mutate(delivery.id)}
              />
            </Reveal>
          ))}

          {deliveries.some((delivery) => terminalStatuses.includes(delivery.status)) && (
            <>
              <h2 className="pt-4 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                Завершённые
              </h2>
              <div className="grid gap-2">
                {deliveries
                  .filter((delivery) => terminalStatuses.includes(delivery.status))
                  .map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper text-muted-foreground">
                        {delivery.kind === "Dropoff" ? (
                          <Truck className="h-4 w-4" />
                        ) : (
                          <Motorcycle className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{kindLabel(delivery.kind)}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {delivery.addressLine}
                        </p>
                      </div>
                      <DeliveryStatusBadge status={delivery.status} />
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <DeliveryMap center={mapCenter} zoom={11} markers={markers} className="h-[22rem]" />

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Курьеры
            </h2>
            <div className="mt-3 space-y-2">
              {approvedCouriers.length === 0 && (
                <p className="text-xs text-muted-foreground">Пока нет одобренных курьеров.</p>
              )}
              {approvedCouriers.map((courier) => (
                <div
                  key={courier.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-paper/40 px-3 py-2.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime/25 text-[10px] font-bold text-forest">
                    {courier.username.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{courier.username}</p>
                    <p className="truncate font-mono text-[9px] text-muted-foreground">
                      {courier.lastLocationAt
                        ? `гео ${new Date(courier.lastLocationAt).toLocaleTimeString("ru-RU", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "нет геоданных"}
                    </p>
                  </div>
                  <CourierStatusBadge status={courier.status} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Truck;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/25 text-forest">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          {hint}
        </span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function AdminDeliveryCard({
  delivery,
  couriers,
  assigning,
  cancelling,
  onAssign,
  onCancel,
}: {
  delivery: DeliveryDto;
  couriers: CourierDto[];
  assigning: boolean;
  cancelling: boolean;
  onAssign: (courierId: number) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string>("");
  const noCourier = !delivery.courierId;

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        noCourier ? "border-amber-300/60" : "border-border/80",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
              delivery.kind === "Dropoff" ? "bg-ink text-lime" : "bg-clay/15 text-clay",
            )}
          >
            {delivery.kind === "Dropoff" ? <Truck className="h-5 w-5" /> : <Motorcycle className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-bold">{kindLabel(delivery.kind)}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              #{delivery.id} · {delivery.bikeModel}
            </p>
          </div>
        </div>
        <DeliveryStatusBadge status={delivery.status} />
      </div>

      <div className="mt-4 grid gap-2 text-xs">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>{delivery.addressLine}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatWindow(delivery.scheduledFrom, delivery.scheduledTo)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {delivery.courierName ? `Курьер: ${delivery.courierName}` : "Курьер не назначен"}
          </span>
          <span className="font-semibold">
            {delivery.fee > 0 ? formatMoney(delivery.fee) : "включено"}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-paper/60 px-3 text-xs outline-none"
        >
          <option value="">Выбрать курьера</option>
          {couriers.map((courier) => (
            <option key={courier.id} value={courier.id}>
              {courier.username} · {courier.status}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => selected && onAssign(Number(selected))}
          disabled={!selected || assigning}
          className="h-9 rounded-xl bg-forest px-4 text-xs font-semibold text-lime transition hover:bg-ink/80 disabled:opacity-50"
        >
          Назначить
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="h-9 rounded-xl border border-border px-4 text-xs font-medium text-muted-foreground transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          Отменить
        </button>
      </div>
    </article>
  );
}
