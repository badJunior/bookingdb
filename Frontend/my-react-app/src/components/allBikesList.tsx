import { useMutation, useQuery } from "@tanstack/react-query";
import { httpClient } from "../utils";
import { useState } from "react";
import useGetAllModels from "../useGetAllModels";
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

export default function AllBikesList() {
  const { role } = useRole();
  const { isPending, error, data } = useQuery({
    queryKey: ["getAllBikes"],
    queryFn: async () => {
      const result = await httpClient.get<GetAllBikesRequest>("/bikes");
      return result.data;
    },
  });

  if (isPending) return <div className="text-center p-8">Загрузка...</div>;
  if (error) return <div className="text-red-600 p-8">Ошибка</div>;

  const allBikes = data.allBikes;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/60 overflow-hidden p-6">
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {role === "Admin" && <AddNewBike />}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Все байки
          </h1>
          <span className="text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full">
            Всего: {allBikes.length}
          </span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allBikes.map((allBike) => (
            <BikeItem key={allBike.id} bikeItem={allBike} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function BikeItem(props: { bikeItem: BikeItem }) {
  const item = props.bikeItem;
  return (
    <Card className="border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm rounded-2xl p-5">
      <CardHeader className="p-0">
        <CardTitle className="text-base font-bold text-slate-800">
          {item.model}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          ID: {item.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100/80 py-3.5">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase">
              Год
            </span>
            <p className="font-bold text-slate-800 text-xs">{item.year}</p>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase">
              Цена/час
            </span>
            <p className="font-bold text-slate-800 text-xs">{item.price} ₽</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type NewBikeData = { modelid: number; year: number; price: number };

export function AddNewBike() {
  const { role } = useRole();
  const [newBikeData, setNewBikeData] = useState<NewBikeData>({
    year: 0,
    modelid: 0,
    price: 0,
  });
  const isValid = newBikeData.year > 0 && newBikeData.modelid > 0;
  const { isPending, isError, data } = useGetAllModels();

  const addBike = useMutation({
    mutationFn: (newBike: NewBikeData) =>
      httpClient.post("/bikes", {
        modelid: newBike.modelid,
        year: newBike.year,
        price: newBike.price,
      }),
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
          Добавление нового мотоцикла
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase text-slate-500">
              Год
            </Label>
            <Input
              type="number"
              value={newBikeData.year}
              onChange={(e) =>
                setNewBikeData((old) => ({
                  ...old,
                  year: Number(e.target.value),
                }))
              }
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase text-slate-500">
              Модель
            </Label>
            <select
              value={newBikeData.modelid}
              onChange={(e) =>
                setNewBikeData((old) => ({
                  ...old,
                  modelid: Number(e.target.value),
                }))
              }
              disabled={isPending || isError}
              className="w-full h-10 rounded-xl border px-3 text-xs"
            >
              <option value="">Выберите модель</option>
              {data?.allModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              )) ?? []}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase text-slate-500">
              Цена/час
            </Label>
            <Input
              type="number"
              value={newBikeData.price}
              onChange={(e) =>
                setNewBikeData((old) => ({
                  ...old,
                  price: Number(e.target.value),
                }))
              }
              className="h-10 rounded-xl"
            />
          </div>
        </div>
        <Button
          onClick={() => role === "Admin" && addBike.mutate(newBikeData)}
          disabled={addBike.isPending || !isValid || role !== "Admin"}
          className="w-full sm:w-auto px-6 h-10 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-500 text-xs font-bold text-white border-0"
        >
          {addBike.isPending ? "Создание..." : "Создать"}
        </Button>
      </CardContent>
    </Card>
  );
}

type BikeItem = {
  id: number;
  model: string;
  availability: boolean;
  year: number;
  category: string;
  power: number;
  price: number;
};
type GetAllBikesRequest = { allBikes: BikeItem[] };
