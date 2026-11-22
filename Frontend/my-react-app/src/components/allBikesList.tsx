import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Gauge, Layers, Plus, RefreshCw } from "lucide-react";
import { BikeImage } from "./bikeImage";
import { httpClient } from "../utils";
import useGetAllModels from "../useGetAllModels";
import { useRole } from "./roleContext";
import { PageShell } from "./pageShell";
import { Reveal } from "./reveal";
import { formatMoney } from "@/lib/delivery";

type BikeItem = {
  id: number;
  model: string;
  availability: boolean;
  year: number;
  category: string;
  power: number;
  price: number;
  imageUrl?: string | null;
};

type GetAllBikesRequest = { allBikes: BikeItem[] };

export default function AllBikesList() {
  const { role } = useRole();

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ["getAllBikes"],
    queryFn: async () => {
      const response = await httpClient.get<GetAllBikesRequest>("/bikes");
      return response.data;
    },
  });

  const bikes = data?.allBikes ?? [];

  return (
    <PageShell
      eyebrow="Парк техники"
      title="Все мотоциклы"
      description="Полный парк техники: реальные модели, категории, характеристики и стоимость часа. Управление доступно администратору."
      actions={
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-lime-deep"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Обновить
        </button>
      }
    >
      {role === "Admin" && <AddNewBike />}

      {isPending && (
        <div className="rounded-2xl border border-border bg-card/60 p-16 text-center">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-forest" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Не удалось загрузить мотоциклы.
        </div>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {bikes.map((bike, index) => (
          <Reveal as="li" key={bike.id} delay={index * 60}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime-deep">
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
            </article>
          </Reveal>
        ))}
      </ul>
    </PageShell>
  );
}

type NewBikeData = { modelid: number; year: number; price: number; imageUrl: string };

function AddNewBike() {
  const queryClient = useQueryClient();
  const { isPending, isError, data } = useGetAllModels();
  const [form, setForm] = useState<NewBikeData>({
    year: new Date().getFullYear(),
    modelid: 0,
    price: 500,
    imageUrl: "",
  });

  const addBike = useMutation({
    mutationFn: (bike: NewBikeData) =>
      httpClient.post("/bikes", { ...bike, imageUrl: bike.imageUrl.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllBikes"] });
      queryClient.invalidateQueries({ queryKey: ["availableBikes"] });
      setForm((previous) => ({ ...previous, modelid: 0, imageUrl: "" }));
    },
  });

  const valid = form.year > 0 && form.modelid > 0 && form.price > 0;

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/25 text-forest">
          <Plus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight">Добавить мотоцикл</h2>
          <p className="text-[11px] text-muted-foreground">Новая единица техники в парке</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Модель
          </span>
          <select
            value={form.modelid || ""}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, modelid: Number(event.target.value) }))
            }
            disabled={isPending || isError}
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none"
          >
            <option value="">Выберите модель</option>
            {data?.allModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            )) ?? []}
          </select>
        </label>

        <label className="space-y-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Год
          </span>
          <input
            type="number"
            value={form.year}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, year: Number(event.target.value) }))
            }
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none"
          />
        </label>

        <label className="space-y-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Цена, ₽/час
          </span>
          <input
            type="number"
            value={form.price}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, price: Number(event.target.value) }))
            }
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none"
          />
        </label>

        <label className="space-y-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Фото (URL)
          </span>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, imageUrl: event.target.value }))
            }
            placeholder="https://..."
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => addBike.mutate(form)}
        disabled={addBike.isPending || !valid}
        className="mt-4 h-11 rounded-2xl bg-forest px-6 text-xs font-bold text-paper transition hover:bg-ink/80 disabled:opacity-50"
      >
        {addBike.isPending ? "Добавляем..." : "Добавить мотоцикл"}
      </button>
    </section>
  );
}
