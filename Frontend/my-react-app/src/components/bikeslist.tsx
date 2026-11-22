import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Gauge, Layers, RefreshCw } from "lucide-react";
import { Motorcycle } from "@phosphor-icons/react";
import { BikeImage } from "./bikeImage";
import { httpClient } from "../utils";
import { useRole } from "./roleContext";
import { PageShell } from "./pageShell";
import { Reveal } from "./reveal";
import { formatMoney } from "@/lib/delivery";
import { cn } from "@/lib/utils";

type AvailableBike = {
  id: number;
  model: string;
  year: number;
  availability: boolean;
  category: string;
  power: number;
  price: number;
  imageUrl?: string | null;
};

type AvailableBikesResponse = { availableBikes: AvailableBike[] };

const pad = (value: number) => String(value).padStart(2, "0");

function localDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function BikesList() {
  const { username } = useRole();
  const navigate = useNavigate();

  const initialStart = localStorage.getItem("booking_startDate") || localDate(new Date());
  const initialEnd =
    localStorage.getItem("booking_endDate") || localDate(new Date(Date.now() + 86400000));

  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ["availableBikes", startDate, endDate],
    queryFn: async () => {
      const response = await httpClient.post<AvailableBikesResponse>("/booking/available-bikes", {
        startDate: new Date(`${startDate}T00:00:00`).toISOString(),
        endDate: new Date(`${endDate}T00:00:00`).toISOString(),
      });
      return response.data;
    },
    enabled: Boolean(startDate && endDate),
  });

  const bikes = data?.availableBikes ?? [];

  const goToBooking = (bikeId: number) => {
    localStorage.setItem("booking_startDate", startDate);
    localStorage.setItem("booking_endDate", endDate);
    localStorage.setItem("booking_bikeId", String(bikeId));
    navigate("/booking/bookings");
  };

  return (
    <PageShell
      eyebrow="Каталог"
      title="Свободные мотоциклы"
      description={`Привет, ${username}. Выберите даты — покажем только те мотоциклы, которые свободны в этот период.`}
      actions={
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-lime-deep"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Обновить
        </button>
      }
    >
      <div className="mb-8 grid gap-4 rounded-2xl border border-border bg-card/80 p-5 backdrop-blur sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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

        <div className="flex h-12 items-center gap-2 rounded-2xl bg-lime/20 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-forest">
          <span className="h-1.5 w-1.5 rounded-full bg-forest" />
          {bikes.length} доступно
        </div>
      </div>

      {isPending && (
        <div className="rounded-2xl border border-border bg-card/60 p-16 text-center">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-forest" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Ищем свободные мотоциклы...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Не удалось загрузить список. {(error as Error).message}
        </div>
      )}

      {!isPending && !error && bikes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
          <Motorcycle className="mx-auto h-9 w-9 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-bold">На эти даты всё занято</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Попробуйте сдвинуть период аренды.
          </p>
        </div>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {bikes.map((bike, index) => (
          <Reveal as="li" key={bike.id} delay={index * 70}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime-deep">
              <div className="-mx-6 -mt-6 mb-5">
                <BikeImage
                  src={bike.imageUrl}
                  alt={`${bike.model} ${bike.year}`}
                  badge={bike.category}
                />
              </div>

              <div className="relative flex items-start justify-between">
                <h3 className="text-xl font-black tracking-tight">{bike.model}</h3>
                <span className="mt-1 shrink-0 rounded-full bg-paper px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  #{bike.id}
                </span>
              </div>
              <p className="relative mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {bike.year} · {bike.power} л.с.
              </p>

              <div className="relative mt-5 grid grid-cols-2 gap-3 border-y border-border/60 py-4">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                      Мощность
                    </p>
                    <p className="text-xs font-bold">{bike.power} л.с.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                      Тариф
                    </p>
                    <p className="text-xs font-bold">{formatMoney(bike.price)}/час</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => goToBooking(bike.id)}
                className="relative mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-forest text-xs font-bold text-paper transition-all hover:bg-ink/80 active:scale-[0.99]"
              >
                Забронировать <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </article>
          </Reveal>
        ))}
      </ul>
    </PageShell>
  );
}
