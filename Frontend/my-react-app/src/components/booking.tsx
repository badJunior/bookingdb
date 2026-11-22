import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Loader2,
  MapPin,
  Search,
  Truck,
} from "lucide-react";
import { httpClient } from "../utils";
import { useRole } from "./roleContext";
import { PageShell } from "./pageShell";
import DeliveryMap from "./deliveryMap";
import { Motorcycle } from "@phosphor-icons/react";
import type { DeliveryOptionsDto, FeePreviewDto } from "@/lib/delivery";
import { formatDistance, formatMoney } from "@/lib/delivery";
import { cn } from "@/lib/utils";

type BikeItem = {
  id: number;
  model: string;
  year: number;
  category: string;
  power: number;
  price: number;
  imageUrl?: string | null;
};

type AllBikesResponse = { allBikes: BikeItem[] };

type AddressSuggestion = {
  displayName: string;
  latitude: number;
  longitude: number;
};

type CreatedBooking = {
  id: number;
  bikeId: number;
  startDate: string;
  endDate: string;
  clientName: string;
  rentalPrice: number;
  deliveryFee: number;
  totalPrice: number;
  paymentDate: string;
  paymentType: string;
  dropoff: { id: number; kind: string; status: string } | null;
  pickup: { id: number; kind: string; status: string } | null;
};

const pad = (value: number) => String(value).padStart(2, "0");

function localDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function Booking() {
  const { username } = useRole();
  const navigate = useNavigate();

  const bikeId = Number(localStorage.getItem("booking_bikeId")) || 1;

  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem("booking_startDate");
    return saved || localDate(new Date());
  });

  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem("booking_endDate");
    return saved || localDate(addDays(new Date(), 1));
  });

  const [clientName, setClientName] = useState(username);
  const [paymentType, setPaymentType] = useState<"Card" | "Cash">("Card");
  const [mode, setMode] = useState<"pickup" | "delivery">("delivery");

  const [address, setAddress] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [deliveryFrom, setDeliveryFrom] = useState(() => `${startDate}T10:00`);
  const [deliveryTo, setDeliveryTo] = useState(() => `${startDate}T12:00`);

  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedBooking | null>(null);

  const { data: bikesData } = useQuery({
    queryKey: ["allBikes"],
    queryFn: async () => {
      const response = await httpClient.get<AllBikesResponse>("/bikes");
      return response.data;
    },
  });

  const { data: options } = useQuery({
    queryKey: ["deliveryOptions"],
    queryFn: async () => {
      const response = await httpClient.get<DeliveryOptionsDto>("/deliveries/options");
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const bike = bikesData?.allBikes.find((item) => item.id === bikeId);

  const rentalStart = useMemo(() => new Date(`${startDate}T10:00:00`), [startDate]);
  const rentalEnd = useMemo(() => new Date(`${endDate}T10:00:00`), [endDate]);
  const durationHours = Math.max(
    0,
    (rentalEnd.getTime() - rentalStart.getTime()) / (1000 * 60 * 60),
  );
  const rentalPrice = Math.round((bike?.price ?? 0) * durationHours);

  useEffect(() => {
    setDeliveryFrom(`${startDate}T10:00`);
    setDeliveryTo(`${startDate}T12:00`);
  }, [startDate]);

  useEffect(() => {
    setClientName((current) => current || username);
  }, [username]);

  useEffect(() => {
    if (address.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await httpClient.get<AddressSuggestion[]>("/addresses/search", {
          params: { q: address },
        });
        setSuggestions(response.data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [address]);

  const feePreview = useQuery({
    queryKey: ["feePreview", point?.lat, point?.lng],
    queryFn: async () => {
      const response = await httpClient.get<FeePreviewDto>("/deliveries/fee-preview", {
        params: { latitude: point?.lat, longitude: point?.lng },
      });
      return response.data;
    },
    enabled: mode === "delivery" && Boolean(point),
    staleTime: 60_000,
  });

  const createBooking = useMutation({
    mutationFn: async () => {
      const deliveryPayload =
        mode === "delivery"
          ? {
              addressLine: address.trim(),
              latitude: point?.lat,
              longitude: point?.lng,
              scheduledFrom: new Date(deliveryFrom).toISOString(),
              scheduledTo: new Date(deliveryTo).toISOString(),
            }
          : null;

      const response = await httpClient.post<CreatedBooking>("/booking/bookings", {
        bikeId,
        startDate: rentalStart.toISOString(),
        endDate: rentalEnd.toISOString(),
        clientName,
        paymentType,
        delivery: deliveryPayload,
      });

      return response.data;
    },
    onSuccess: (booking) => {
      if (paymentType === "Card") {
        sessionStorage.setItem(
          "pendingBooking",
          JSON.stringify({
            bookingId: booking.id,
            totalPrice: booking.totalPrice,
            rentalPrice: booking.rentalPrice,
            deliveryFee: booking.deliveryFee,
            hasDelivery: mode === "delivery",
          }),
        );
        navigate("/payment");
        return;
      }

      setCreated(booking);
    },
    onError: (mutationError: any) => {
      setError(
        mutationError.response?.data?.error ||
          mutationError.response?.data?.message ||
          "Не удалось создать бронь. Проверьте данные и попробуйте ещё раз.",
      );
    },
  });

  const deliveryFee = mode === "delivery" && feePreview.data ? feePreview.data.fee : 0;
  const totalPrice = rentalPrice + deliveryFee;

  const submit = () => {
    setError("");

    if (!clientName.trim()) {
      setError("Укажите имя клиента.");
      return;
    }

    if (rentalEnd <= rentalStart) {
      setError("Дата окончания должна быть позже даты начала.");
      return;
    }

    if (mode === "delivery") {
      if (!address.trim() || !point) {
        setError("Укажите адрес и точку на карте.");
        return;
      }

      if (!feePreview.data?.withinRange) {
        setError(
          feePreview.data
            ? `Адрес слишком далеко: ${formatDistance(feePreview.data.distanceKm)}. Максимум — ${options?.maxDistanceKm ?? 30} км.`
            : "Не удалось рассчитать стоимость доставки.",
        );
        return;
      }

      if (new Date(deliveryTo) <= new Date(deliveryFrom)) {
        setError("Окно доставки указано неверно.");
        return;
      }

      if (new Date(deliveryTo) > rentalEnd) {
        setError("Доставка должна завершиться до конца аренды.");
        return;
      }
    }

    createBooking.mutate();
  };

  if (created) {
    return (
      <PageShell
        eyebrow="Готово"
        title="Бронь оформлена"
        description="Оплата при получении. Доставка появится в разделе «Мои доставки»."
      >
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime/30 text-forest animate-pulse-ring">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-2xl font-black tracking-tight">Бронь #{created.id}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {created.clientName} · {created.dropoff ? "с доставкой" : "самовывоз"} ·{" "}
            {formatMoney(created.totalPrice)}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate("/my-bookings")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-forest px-5 text-sm font-semibold text-paper transition hover:bg-ink/80"
            >
              Мои аренды <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/booking/available-bikes")}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-5 text-sm font-semibold transition hover:bg-muted"
            >
              К каталогу
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Оформление"
      title="Соберите аренду"
      description="Выберите способ получения, окно доставки и оплату. Стоимость доставки считается по расстоянию от точки выдачи."
    >
      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <section className="animate-reveal rounded-2xl border border-border bg-card p-6">
            <SectionTitle index="01" title="Мотоцикл и сроки" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl border border-border/70 bg-paper/60 p-4">
                <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-[#f4f6ef]">
                  {bike?.imageUrl ? (
                    <img
                      src={bike.imageUrl}
                      alt={bike.model}
                      loading="lazy"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Motorcycle className="h-7 w-7 text-muted-foreground/70" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">{bike?.model ?? `Мотоцикл #${bikeId}`}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {bike ? `${bike.year} · ${bike.category} · ${bike.power} л.с.` : "Загрузка карточки"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-lime/30 px-3 py-1 font-mono text-[10px] font-bold text-forest">
                  {bike ? `${bike.price} ₽/час` : "—"}
                </span>
              </div>

              <label className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Начало аренды
                </span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-border bg-paper/60 pl-11 pr-3 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Конец аренды
                </span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-border bg-paper/60 pl-11 pr-3 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="animate-reveal rounded-2xl border border-border bg-card p-6 [animation-delay:80ms]">
            <SectionTitle index="02" title="Как получить мотоцикл" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ModeCard
                active={mode === "delivery"}
                title="Доставка"
                hint="Привезём и заберём после аренды"
                icon={Truck}
                onClick={() => setMode("delivery")}
              />
              <ModeCard
                active={mode === "pickup"}
                title="Самовывоз"
                hint="Волочаевская 17, Омск"
                icon={Home}
                onClick={() => setMode("pickup")}
              />
            </div>

            {mode === "delivery" && (
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Доставка с
                    </span>
                    <input
                      type="datetime-local"
                      value={deliveryFrom}
                      onChange={(event) => setDeliveryFrom(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-border bg-paper/60 px-4 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      До
                    </span>
                    <input
                      type="datetime-local"
                      value={deliveryTo}
                      onChange={(event) => setDeliveryTo(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-border bg-paper/60 px-4 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                    />
                  </label>
                </div>

                <div className="relative space-y-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Адрес доставки
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={address}
                      onChange={(event) => {
                        setAddress(event.target.value);
                        setPoint(null);
                      }}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Улица, дом, Омск"
                      className="h-12 w-full rounded-2xl border border-border bg-paper/60 pl-11 pr-11 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                    />
                    {searching && (
                      <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-card">
                      {suggestions.map((suggestion) => (
                        <li key={`${suggestion.latitude}-${suggestion.longitude}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setAddress(suggestion.displayName);
                              setPoint({
                                lat: suggestion.latitude,
                                lng: suggestion.longitude,
                              });
                              setSuggestions([]);
                              setShowSuggestions(false);
                            }}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left text-xs transition hover:bg-lime/15"
                          >
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
                            <span className="line-clamp-2">{suggestion.displayName}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <DeliveryMap
                  center={
                    options
                      ? [options.mapCenterLatitude, options.mapCenterLongitude]
                      : [54.9885, 73.3242]
                  }
                  zoom={12}
                  picked={point ? { lat: point.lat, lng: point.lng } : null}
                  onPick={(lat, lng) => {
                    setPoint({ lat, lng });
                    if (!address.trim()) setAddress("Точка на карте, Омск");
                  }}
                  markers={
                    options
                      ? [
                          {
                            id: "shop",
                            lat: options.shopLatitude,
                            lng: options.shopLongitude,
                            label: "Пункт выдачи",
                            tone: "shop" as const,
                          },
                        ]
                      : []
                  }
                  className="h-64 cursor-crosshair"
                />

                <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Нажмите на карту, чтобы уточнить точку, или выберите адрес из подсказок.
                </p>

                {feePreview.data && (
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-xs",
                      feePreview.data.withinRange
                        ? "border-lime-deep/30 bg-lime/15 text-forest"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                    )}
                  >
                    <span>
                      {feePreview.data.withinRange ? "Доставка и забор" : "Вне радиуса доставки"} ·{" "}
                      {formatDistance(feePreview.data.distanceKm)}
                    </span>
                    <span className="font-bold">
                      {feePreview.data.withinRange
                        ? formatMoney(feePreview.data.fee)
                        : `макс. ${options?.maxDistanceKm ?? 30} км`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="animate-reveal rounded-2xl border border-border bg-card p-6 [animation-delay:160ms]">
            <SectionTitle index="03" title="Контакт и оплата" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Имя клиента
                </span>
                <input
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Как к вам обращаться"
                  className="h-12 w-full rounded-2xl border border-border bg-paper/60 px-4 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                />
              </label>

              <PaymentCard
                active={paymentType === "Card"}
                title="Картой"
                hint="Онлайн-оплата"
                icon={CreditCard}
                onClick={() => setPaymentType("Card")}
              />
              <PaymentCard
                active={paymentType === "Cash"}
                title="Наличными"
                hint="При получении мотоцикла"
                icon={Banknote}
                onClick={() => setPaymentType("Cash")}
              />
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={createBooking.isPending}
              className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-forest text-sm font-bold text-paper transition-all hover:bg-ink/80 active:scale-[0.99] disabled:opacity-60"
            >
              {createBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Оформляем...
                </>
              ) : (
                <>
                  {paymentType === "Card" ? "Перейти к оплате" : "Забронировать"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="animate-reveal rounded-2xl border border-border bg-forest p-6 text-paper [animation-delay:120ms]">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-paper/40">
                Итого
              </p>
              <span className="rounded-full bg-lime/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-lime">
                {mode === "delivery" ? "с доставкой" : "самовывоз"}
              </span>
            </div>

            <p className="mt-4 text-4xl font-black tracking-tight">
              {formatMoney(totalPrice)}
            </p>
            <p className="mt-1 text-xs text-paper/45">
              {durationHours > 0
                ? `${Math.round(durationHours)} ч аренды`
                : "Укажите корректные даты"}
            </p>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-xs">
              <Row label="Аренда мотоцикла" value={formatMoney(rentalPrice)} />
              <Row
                label="Доставка + забор"
                value={mode === "delivery" ? formatMoney(deliveryFee) : "0 ₽"}
                muted={mode !== "delivery"}
              />
              <Row label="Оплата" value={paymentType === "Card" ? "Картой" : "Наличными"} muted />
            </div>

            <div className="mt-6 space-y-2 rounded-2xl bg-white/5 p-4 text-[11px] leading-relaxed text-paper/50">
              <p className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" />
                Курьер назначается автоматически ближе к выбранному окну.
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" />
                Забор мотоцикла входит в стоимость и произойдёт в конце аренды.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime font-mono text-[10px] font-bold text-ink">
        {index}
      </span>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
    </div>
  );
}

function ModeCard({
  active,
  title,
  hint,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  icon: typeof Truck;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300",
        active
          ? "border border-border bg-lime/40"
          : "border-border bg-paper/40 hover:border-forest/20 hover:bg-paper/70",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          active ? "bg-ink text-lime" : "bg-muted text-muted-foreground group-hover:bg-ink/80/5",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <span
        className={cn(
          "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
          active ? "border-forest bg-forest text-lime" : "border-border",
        )}
      >
        {active && <CheckCircle2 className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

function PaymentCard({
  active,
  title,
  hint,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  icon: typeof CreditCard;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
        active ? "border-lime-deep bg-lime/15" : "border-border bg-paper/40 hover:bg-paper/70",
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-forest" : "text-muted-foreground")} />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-paper/50">{label}</span>
      <span className={muted ? "text-paper/60" : "font-semibold text-paper"}>{value}</span>
    </div>
  );
}
