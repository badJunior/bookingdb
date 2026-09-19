import { useMutation } from "@tanstack/react-query";
import { httpClient } from "../../utils";
import { useState } from "react";
import useGetAllCategories from "../../useGetAllCategories";
import useGetAllModels, { type ModelItem } from "../../useGetAllModels";
import { useRole } from "../../components/roleContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ModelsPage() {
  const { role } = useRole();
  const { isPending, error, data } = useGetAllModels();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50/60">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Загрузка каталога...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50/60 p-4">
        <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-3.5 rounded-xl">
          Ошибка при загрузке: {(error as any).message}
        </div>
      </div>
    );
  }

  const allModels = data.allModels;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/60 overflow-hidden p-6">
      {/* Декоративный фон */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-200/30 to-lime-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-200/20 to-emerald-100/30 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Форма Администратора */}
        {role === "Admin" && <AddModelForm />}

        {/* Заголовок секции */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800">
                Каталог моделей
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Доступные серии и поколения мотоциклов
              </p>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full shadow-sm">
              Моделей: {allModels.length}
            </span>
          </div>

          {/* Сетка списка */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allModels.map((model) => (
              <ModelListItem key={model.id} modelItem={model} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModelListItem(props: { modelItem: ModelItem }) {
  const item = props.modelItem;
  return (
    <Card className="border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm rounded-2xl p-5 hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
            {item.name || "Базовая спецификация"}
          </h3>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md shrink-0">
            ID {item.id}
          </span>
        </div>

        {/* Характеристики с иконками */}
        <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100/80 py-3.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Мощность
              </span>
              <p className="font-bold text-slate-800 text-xs truncate">
                {item.power} л.с.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.44 1.44 0 002.036 0l4.319-4.319a1.44 1.44 0 000-2.036l-9.581-9.581a2.25 2.25 0 00-1.591-.659z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6h.008v.008H6V6z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Категория
              </span>
              <p className="font-bold text-slate-700 text-xs truncate">
                {item.categoryName || `ID: ${item.categoryId}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя плашка с датами */}
      <div className="flex items-center justify-between text-xs mt-4 pt-1">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          <span>Года выпуска:</span>
        </div>
        <span className="font-bold text-slate-700 bg-slate-100/80 px-2.5 py-0.5 rounded-lg text-[11px]">
          {item.startYear} — {item.endYear || "н.в."}
        </span>
      </div>
    </Card>
  );
}

export function ModelsList({ models }: { models: ModelItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {models.map((model) => (
        <ModelListItem key={model.id} modelItem={model} />
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
  const { role } = useRole();
  const [newModelData, setNewModelData] = useState<NewModelData>({
    name: "",
    power: 0,
    startYear: 0,
    endYear: 0,
  });

  const isValid =
    newModelData.name.trim() !== "" &&
    newModelData.power > 0 &&
    newModelData.categoryId != null;

  const { isPending, isError, data } = useGetAllCategories();

  const addModel = useMutation({
    mutationFn: (newModel: NewModelData) => {
      return httpClient.post("/models", newModel);
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  return (
    <Card className="border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden animate-in fade-in-50 slide-in-from-top-4 duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-800">
          Панель администратора
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Добавление новой модели мотоцикла в систему
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="m-name"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Название
            </Label>
            <Input
              id="m-name"
              type="text"
              placeholder="CBR600RR"
              value={newModelData.name}
              onChange={(e) =>
                setNewModelData((old) => ({ ...old, name: e.target.value }))
              }
              className="h-10 rounded-xl border-slate-200 bg-white/60 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10 text-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="m-power"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Мощность
            </Label>
            <Input
              id="m-power"
              type="number"
              placeholder="л.с."
              value={newModelData.power || ""}
              onChange={(e) =>
                setNewModelData((old) => ({
                  ...old,
                  power: Number(e.target.value),
                }))
              }
              className="h-10 rounded-xl border-slate-200 bg-white/60 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10 text-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="m-start"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Старт выпуска
            </Label>
            <Input
              id="m-start"
              type="number"
              placeholder="Год"
              value={newModelData.startYear || ""}
              onChange={(e) =>
                setNewModelData((old) => ({
                  ...old,
                  startYear: Number(e.target.value),
                }))
              }
              className="h-10 rounded-xl border-slate-200 bg-white/60 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10 text-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="m-end"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Конец выпуска
            </Label>
            <Input
              id="m-end"
              type="number"
              placeholder="Год"
              value={newModelData.endYear || ""}
              onChange={(e) =>
                setNewModelData((old) => ({
                  ...old,
                  endYear: Number(e.target.value),
                }))
              }
              className="h-10 rounded-xl border-slate-200 bg-white/60 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10 text-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="m-cat"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Категория
            </Label>
            <select
              id="m-cat"
              value={newModelData.categoryId ?? ""}
              onChange={(e) =>
                setNewModelData((old) => ({
                  ...old,
                  categoryId:
                    e.target.value !== "" ? Number(e.target.value) : undefined,
                }))
              }
              disabled={isPending || isError}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all disabled:opacity-50"
            >
              <option value="">Выберите категорию</option>
              {data?.allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              )) ?? []}
            </select>
          </div>
        </div>

        <Button
          onClick={() => role === "Admin" && addModel.mutate(newModelData)}
          disabled={addModel.isPending || !isValid || role !== "Admin"}
          className="w-full sm:w-auto px-6 h-10 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-500 text-xs font-bold text-white shadow-md shadow-emerald-600/10 hover:opacity-95 active:scale-[0.98] disabled:opacity-40 border-0 cursor-pointer transition-all duration-200"
        >
          {addModel.isPending ? "Создание..." : "Создать модель"}
        </Button>
      </CardContent>
    </Card>
  );
}
