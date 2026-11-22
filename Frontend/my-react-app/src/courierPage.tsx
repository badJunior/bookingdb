import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  LocateFixed,
  MapPin,
  Navigation,
  Power,
  RefreshCw,
  ShieldAlert,
  Truck,
  UserRound,
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
  type DeliveryStatus,
} from "@/lib/delivery";
import { cn } from "@/lib/utils";

const nextAction: Partial<
  Record<DeliveryStatus, { status: DeliveryStatus; label: string }>
> = {
  Assigned: { status: "EnRoute", label: "Я выехал" },
  EnRoute: { status: "Arrived", label: "Я на месте" },
  Arrived: { status: "Completed", label: "Доставлено" },
};

export default function CourierPage() {
  const queryClient = useQueryClient();
  const lastPosition = useRef<{ lat: number; lng: number } | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "asking" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const courierQuery = useQuery<CourierDto | null>({
    queryKey: ["courierMe"],
    queryFn: async () => {
      const response = await httpClient.get<CourierDto>("/couriers/me");
      return response.data;
    },
    retry: false,
  });

  const courier = courierQuery.data ?? null;
  const isApproved = Boolean(courier?.isApproved);
  const isOnline = courier?.status === "Available" || courier?.status === "Busy";

  const deliveriesQuery = useQuery({
    queryKey: ["courierDeliveries"],
    queryFn: async () => {
      const response = await httpClient.get<DeliveryDto[]>("/deliveries");
      return response.data;
    },
    enabled: isApproved,
    refetchInterval: 15000,
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
  const activeDelivery = deliveries.find((delivery) => !terminalStatuses.includes(delivery.status));

  useEffect(() => {
    if (!isApproved || !isOnline) {
      setGeoState("idle");
      return;
    }

    if (!navigator.geolocation) {
      setGeoState("error");
      setMessage("Браузер не поддерживает геолокацию.");
      return;
    }

    setGeoState("asking");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        lastPosition.current = next;
        setCoords(next);
        setGeoState("ok");
        setMessage("");
      },
      (geoError) => {
        setGeoState("error");
        setMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Разрешите доступ к геолокации в настройках браузера."
            : "Не удалось определить местоположение.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );

    const send = async () => {
      const position = lastPosition.current;
      if (!position) return;

      try {
        await httpClient.post("/couriers/me/location", {
          latitude: position.lat,
          longitude: position.lng,
        });
      } catch {
        // The next tick will retry.
      }
    };

    send();
    const interval = setInterval(send, 20000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [isApproved, isOnline]);

  const statusMutation = useMutation({
    mutationFn: async (status: "Available" | "Offline") => {
      const response = await httpClient.post<CourierDto>("/couriers/me/status", { status });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["courierMe"], data);
      queryClient.invalidateQueries({ queryKey: ["courierDeliveries"] });
      setMessage("");
    },
    onError: (mutationError: any) => {
      setMessage(
        mutationError.response?.data?.error || "Не удалось сменить статус.",
      );
    },
  });

  const deliveryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: DeliveryStatus }) => {
      const response = await httpClient.post<DeliveryDto>(`/deliveries/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courierDeliveries"] });
      queryClient.invalidateQueries({ queryKey: ["courierMe"] });
    },
    onError: (mutationError: any) => {
      setMessage(
        mutationError.response?.data?.error || "Не удалось обновить статус доставки.",
      );
    },
  });

  const goOnline = () => {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage("Браузер не поддерживает геолокацию.");
      return;
    }

    setGeoState("asking");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        lastPosition.current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(lastPosition.current);
        setGeoState("ok");
        statusMutation.mutate("Available");
      },
      (geoError) => {
        setGeoState("error");
        setMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Без доступа к геолокации нельзя выйти на линию."
            : "Не удалось определить местоположение.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  };

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

    if (coords) {
      list.push({
        id: "me",
        lat: coords.lat,
        lng: coords.lng,
        label: "Вы здесь",
        tone: "courier" as const,
      });
    }

    if (activeDelivery) {
      list.push({
        id: `delivery-${activeDelivery.id}`,
        lat: activeDelivery.latitude,
        lng: activeDelivery.longitude,
        label: activeDelivery.addressLine,
        tone: "dropoff" as const,
      });
    }

    return list;
  }, [optionsQuery.data, coords, activeDelivery]);

  if (courierQuery.isPending) {
    return (
      <PageShell eyebrow="Смена" title="Курьерская панель">
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-forest" />
        </div>
      </PageShell>
    );
  }

  const forbidden =
    courierQuery.error &&
    (courierQuery.error as any).response?.status === 403;

  if (forbidden || !isApproved) {
    return (
      <PageShell
        eyebrow="Заявка"
        title="Ждём одобрения"
        description="Аккаунт курьера создан, но доступ к заказам ещё не включён администратором."
      >
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 animate-pulse-ring">
            <ShieldAlert className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-xl font-bold tracking-tight">Заявка на проверке</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Как только администратор подтвердит аккаунт, здесь появится смена,
            геолокация и заказы. Обычно это занимает немного времени.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Смена"
      title="Курьерская панель"
      description="Включите линию, разрешите геолокацию — система назначит ближайший заказ. Один курьер везёт только один заказ."
      actions={
        <CourierStatusBadge status={courier?.status ?? "Offline"} />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <section className="animate-reveal rounded-2xl border border-border bg-forest p-6 text-paper">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-paper/40">
                Статус смены
              </p>
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  isOnline ? "bg-lime animate-pulse" : "bg-paper/25",
                )}
              />
            </div>

            <p className="mt-3 text-3xl font-black tracking-tight">
              {isOnline ? "Вы на линии" : "Линия выключена"}
            </p>
            <p className="mt-1 text-xs text-paper/45">
              {isOnline
                ? "Ожидайте заказ — уведомление появится здесь."
                : "Включите линию, чтобы получать заказы."}
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/5 p-3.5">
              <LocateFixed className={cn("h-4 w-4", geoState === "ok" ? "text-lime" : "text-paper/40")} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35">
                  Геолокация
                </p>
                <p className="mt-0.5 truncate text-xs text-paper/70">
                  {geoState === "ok" && coords
                    ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                    : geoState === "asking"
                      ? "Определяем..."
                      : isOnline
                        ? "Нет сигнала"
                        : "Включится вместе со сменой"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => (isOnline ? statusMutation.mutate("Offline") : goOnline())}
              disabled={statusMutation.isPending}
              className={cn(
                "mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all active:scale-[0.99] disabled:opacity-60",
                isOnline
                  ? "bg-white/10 text-paper hover:bg-white/15"
                  : "bg-lime text-ink hover:bg-lime-deep",
              )}
            >
              <Power className="h-4 w-4" />
              {statusMutation.isPending
                ? "Меняем..."
                : isOnline
                  ? "Завершить смену"
                  : "Выйти на линию"}
            </button>

            {message && (
              <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-[11px] text-rose-200">
                {message}
              </p>
            )}
          </section>

          <Reveal delay={80}>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <UserRound className="h-4 w-4 text-muted-foreground" /> Профиль курьера
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                <ProfileRow label="Имя" value={courier?.username ?? "—"} />
                <ProfileRow label="Телефон" value={courier?.phone ?? "—"} />
                <ProfileRow label="Email" value={courier?.email ?? "—"} />
              </div>
            </div>
          </Reveal>
        </div>

        <div className="space-y-5">
          {activeDelivery ? (
            <ActiveDeliveryCard
              delivery={activeDelivery}
              pending={deliveryMutation.isPending}
              onAdvance={(status) => deliveryMutation.mutate({ id: activeDelivery.id, status })}
            />
          ) : (
            <Reveal>
              <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
                <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 text-base font-bold">Активного заказа нет</h2>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  {isOnline
                    ? "Как только появится заказ рядом с вами, он назначится автоматически."
                    : "Включите линию, чтобы начать получать заказы."}
                </p>
              </div>
            </Reveal>
          )}

          <DeliveryMap
            center={mapCenter}
            zoom={12}
            markers={markers}
            className="h-72"
          />
        </div>
      </div>

      {deliveries.length > 0 && (
        <section className="mt-10 space-y-4">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            История заказов
          </h2>
          <div className="grid gap-3">
            {deliveries.map((delivery, index) => (
              <Reveal key={delivery.id} delay={index * 50}>
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper text-muted-foreground">
                    {delivery.kind === "Dropoff" ? <Truck className="h-4 w-4" /> : <Motorcycle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{kindLabel(delivery.kind)}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{delivery.addressLine}</p>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {formatWindow(delivery.scheduledFrom, delivery.scheduledTo)}
                  </p>
                  <DeliveryStatusBadge status={delivery.status} />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className="truncate pl-4 text-xs font-medium">{value}</span>
    </div>
  );
}

function ActiveDeliveryCard({
  delivery,
  pending,
  onAdvance,
}: {
  delivery: DeliveryDto;
  pending: boolean;
  onAdvance: (status: DeliveryStatus) => void;
}) {
  const action = nextAction[delivery.status];

  return (
    <article className="animate-reveal rounded-2xl bg-lime/10 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-forest">
          Активный заказ
        </p>
        <DeliveryStatusBadge status={delivery.status} />
      </div>

      <h2 className="mt-3 text-2xl font-black tracking-tight text-ink">
        {kindLabel(delivery.kind)}
      </h2>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-forest/60">
        {delivery.bikeModel} · заказ #{delivery.bookingId}
      </p>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="flex items-start gap-3 rounded-2xl bg-card/80 p-3.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Адрес
            </p>
            <p className="mt-0.5 font-medium leading-snug">{delivery.addressLine}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card/80 p-3.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Окно
            </p>
            <p className="mt-0.5 text-[11px] font-medium">
              {formatWindow(delivery.scheduledFrom, delivery.scheduledTo)}
            </p>
          </div>
          <div className="rounded-2xl bg-card/80 p-3.5">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Клиент
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium">{delivery.clientName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-card/80 p-3.5 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Navigation className="h-3.5 w-3.5" /> {formatMoney(delivery.fee || 0)}
          </span>
          <a
            href={`https://yandex.ru/maps/?rtext=~${delivery.latitude},${delivery.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-forest underline-offset-4 hover:underline"
          >
            Открыть маршрут
          </a>
        </div>
      </div>

      {action ? (
        <button
          type="button"
          onClick={() => onAdvance(action.status)}
          disabled={pending}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-forest text-sm font-bold text-paper transition hover:bg-ink/80 active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Обновляем..." : action.label}
        </button>
      ) : (
        <p className="mt-5 rounded-2xl bg-card/70 p-3 text-center text-xs text-muted-foreground">
          Ожидает следующего шага
        </p>
      )}
    </article>
  );
}
