import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { httpClient } from "../utils";
import useGetAllCategories, { type CategoryItem } from "../useGetAllCategories";
import { useRole } from "./roleContext";
import { PageShell } from "./pageShell";
import { Reveal } from "./reveal";

export default function CategoriesPage() {
  const { role } = useRole();
  const { isPending, error, data } = useGetAllCategories();

  const categories = data?.allCategories ?? [];

  return (
    <PageShell
      eyebrow="Каталог"
      title="Категории"
      description="Классы техники: от городских моделей до спортивных. Администратор может добавлять новые категории."
    >
      {role === "Admin" && <AddCategoryForm />}

      {isPending && (
        <div className="rounded-2xl border border-border bg-card/60 p-16 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Загрузка...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Не удалось загрузить категории.
        </div>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <Reveal as="li" key={category.id} delay={index * 60}>
            <article className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime-deep">
              <span className="pointer-events-none absolute -bottom-8 right-2 font-mono text-[80px] font-black leading-none text-ink/[0.04]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime/25 text-forest transition-transform duration-500 group-hover:-rotate-6">
                <Tag className="h-5 w-5" />
              </span>
              <div className="relative min-w-0">
                <h3 className="truncate text-lg font-bold tracking-tight">{category.name}</h3>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  ID {category.id}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </ul>
    </PageShell>
  );
}

export function CategoryListItem({ categoryItem }: { categoryItem: CategoryItem }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Tag className="h-4 w-4 text-forest" />
      <span className="text-sm font-semibold">{categoryItem.name}</span>
      <span className="ml-auto font-mono text-[9px] text-muted-foreground">#{categoryItem.id}</span>
    </div>
  );
}

function AddCategoryForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const addCategory = useMutation({
    mutationFn: (value: string) => httpClient.post("/categories", { name: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllCategories"] });
      setName("");
    },
  });

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/25 text-forest">
          <Plus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight">Новая категория</h2>
          <p className="text-[11px] text-muted-foreground">Например: «Спорт», «Туризм», «Электро»</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название категории"
          className="h-11 flex-1 rounded-2xl border border-border bg-paper/60 px-4 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
        />
        <button
          type="button"
          onClick={() => name.trim() && addCategory.mutate(name.trim())}
          disabled={addCategory.isPending || !name.trim()}
          className="h-11 rounded-2xl bg-forest px-6 text-xs font-bold text-paper transition hover:bg-ink/80 disabled:opacity-50"
        >
          {addCategory.isPending ? "Добавляем..." : "Добавить"}
        </button>
      </div>
    </section>
  );
}
