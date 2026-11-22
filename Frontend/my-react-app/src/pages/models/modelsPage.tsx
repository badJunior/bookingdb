import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarRange, Layers, Plus, Zap } from "lucide-react";
import { httpClient } from "../../utils";
import useGetAllCategories from "../../useGetAllCategories";
import useGetAllModels, { type ModelItem } from "../../useGetAllModels";
import { useRole } from "../../components/roleContext";
import { PageShell } from "../../components/pageShell";
import { Reveal } from "../../components/reveal";

export default function ModelsPage() {
  const { role } = useRole();
  const { isPending, error, data } = useGetAllModels();

  const models = data?.allModels ?? [];

  return (
    <PageShell
      eyebrow="Каталог"
      title="Модели"
      description="Технические характеристики и годы выпуска. Модели используются при добавлении конкретных мотоциклов в парк."
    >
      {role === "Admin" && <AddModelForm />}

      {isPending && (
        <div className="rounded-2xl border border-border bg-card/60 p-16 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Загрузка...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Не удалось загрузить модели.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model, index) => (
          <ModelListItem key={model.id} modelItem={model} index={index} />
        ))}
      </div>
    </PageShell>
  );
}

export function ModelListItem({ modelItem, index = 0 }: { modelItem: ModelItem; index?: number }) {
  return (
    <Reveal delay={index * 60}>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime-deep">
        <span className="pointer-events-none absolute -right-5 -top-8 font-mono text-[92px] font-black leading-none text-ink/[0.04] transition-colors group-hover:text-ink/[0.07]">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative flex items-start justify-between gap-2">
          <h3 className="truncate text-xl font-black tracking-tight">{modelItem.name}</h3>
          <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            #{modelItem.id}
          </span>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3 border-y border-border/60 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime/25 text-forest">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Мощность
              </p>
              <p className="text-xs font-bold">{modelItem.power} л.с.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay/10 text-clay">
              <Layers className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Категория
              </p>
              <p className="truncate text-xs font-bold">
                {modelItem.categoryName || `ID ${modelItem.categoryId}`}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Годы выпуска</span>
          <span className="ml-auto rounded-lg bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-ink">
            {modelItem.startYear} — {modelItem.endYear || "н.в."}
          </span>
        </div>
      </article>
    </Reveal>
  );
}

export function ModelsList({ models }: { models: ModelItem[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {models.map((model, index) => (
        <ModelListItem key={model.id} modelItem={model} index={index} />
      ))}
    </div>
  );
}

type NewModelData = {
  power: number;
  startYear: number;
  endYear: number;
  name: string;
  categoryId?: number;
};

function AddModelForm() {
  const queryClient = useQueryClient();
  const { isPending, isError, data } = useGetAllCategories();
  const [form, setForm] = useState<NewModelData>({
    name: "",
    power: 0,
    startYear: new Date().getFullYear(),
    endYear: 0,
  });

  const addModel = useMutation({
    mutationFn: (model: NewModelData) => httpClient.post("/models", model),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllModels"] });
      setForm({ name: "", power: 0, startYear: new Date().getFullYear(), endYear: 0 });
    },
  });

  const valid =
    form.name.trim() !== "" && form.power > 0 && form.startYear > 0 && form.categoryId != null;

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/25 text-forest">
          <Plus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight">Новая модель</h2>
          <p className="text-[11px] text-muted-foreground">Добавьте характеристики и категорию</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Название">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, name: event.target.value }))
            }
            placeholder="CBR600RR"
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
          />
        </Field>

        <Field label="Мощность, л.с.">
          <input
            type="number"
            value={form.power || ""}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, power: Number(event.target.value) }))
            }
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
          />
        </Field>

        <Field label="Старт выпуска">
          <input
            type="number"
            value={form.startYear || ""}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, startYear: Number(event.target.value) }))
            }
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
          />
        </Field>

        <Field label="Конец выпуска">
          <input
            type="number"
            value={form.endYear || ""}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, endYear: Number(event.target.value) }))
            }
            placeholder="н.в."
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
          />
        </Field>

        <Field label="Категория">
          <select
            value={form.categoryId ?? ""}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                categoryId: event.target.value !== "" ? Number(event.target.value) : undefined,
              }))
            }
            disabled={isPending || isError}
            className="h-11 w-full rounded-2xl border border-border bg-paper/60 px-3 text-sm outline-none disabled:opacity-50"
          >
            <option value="">Выберите</option>
            {data?.allCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            )) ?? []}
          </select>
        </Field>
      </div>

      <button
        type="button"
        onClick={() => addModel.mutate(form)}
        disabled={addModel.isPending || !valid}
        className="mt-4 h-11 rounded-2xl bg-forest px-6 text-xs font-bold text-paper transition hover:bg-ink/80 disabled:opacity-50"
      >
        {addModel.isPending ? "Добавляем..." : "Добавить модель"}
      </button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
