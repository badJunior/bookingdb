import { useMutation } from "@tanstack/react-query";
import { httpClient } from "../utils";
import type { CategoryItem } from "../useGetAllCategories";
import useGetAllCategories from "../useGetAllCategories";
import { useState } from "react";
import { useRole } from "./roleContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  const { role } = useRole();
  const { isPending, error, data } = useGetAllCategories();

  if (isPending) return <div className="text-center p-8">Загрузка...</div>;
  if (error)
    return (
      <div className="text-red-600 p-8">Ошибка: {(error as any).message}</div>
    );

  const allCategories = data.allCategories;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/60 overflow-hidden p-6">
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {role === "Admin" && <AddCategoryForm />}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Каталог категорий
          </h1>
          <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full">
            Категорий: {allCategories.length}
          </span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allCategories.map((c) => (
            <CategoryListItem key={c.id} categoryItem={c} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function CategoryListItem(props: { categoryItem: CategoryItem }) {
  const item = props.categoryItem;
  return (
    <Card className="border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm rounded-2xl p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-base font-bold text-slate-800">
          {item.name}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          ID: {item.id}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

type NewCategoryData = { name?: string };

function AddCategoryForm() {
  const { role } = useRole();
  const [newCategoryData, setNewCategoryData] = useState<NewCategoryData>({
    name: "",
  });

  const addCategory = useMutation({
    mutationFn: (newCategory: NewCategoryData) =>
      httpClient.post("/categories", { name: newCategory.name }),
    onSuccess: () => {
      window.location.reload();
    },
  });

  return (
    <Card className="border-slate-200/80 bg-white/70 backdrop-blur-xl rounded-3xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-800">
          Панель администратора
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Добавление новой категории
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold uppercase text-slate-500">
            Название
          </Label>
          <Input
            type="text"
            placeholder="Спортбайки"
            value={newCategoryData.name}
            onChange={(e) =>
              setNewCategoryData((old) => ({ ...old, name: e.target.value }))
            }
            className="h-10 rounded-xl"
          />
        </div>
        <Button
          onClick={() =>
            role === "Admin" && addCategory.mutate(newCategoryData)
          }
          disabled={addCategory.isPending || role !== "Admin"}
          className="w-full sm:w-auto px-6 h-10 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-500 text-xs font-bold text-white border-0"
        >
          {addCategory.isPending ? "Создание..." : "Создать"}
        </Button>
      </CardContent>
    </Card>
  );
}
