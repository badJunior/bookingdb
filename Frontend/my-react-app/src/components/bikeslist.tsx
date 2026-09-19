import { useQuery } from "@tanstack/react-query";
import { httpClient } from "../utils";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BikesList() {
  const username = localStorage.getItem("username") || "Гость";
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { isPending, error, data } = useQuery({
    queryKey: ["getAvailableBikes"],
    queryFn: () => {
      const result = httpClient.post<GetAllAvailableBikes>(
        "/booking/available-bikes",
        {},
      );
      return result.then((r) => r.data);
    },
  });

  if (isPending) return <div className="text-center p-8">Загрузка...</div>;
  if (error)
    return <div className="text-red-600 p-8">Ошибка: {error.message}</div>;

  const availableBikes = data.availableBikes;

  const goToBooking = (bikeId: number) => {
    localStorage.setItem("booking_startDate", startDate);
    localStorage.setItem("booking_endDate", endDate);
    localStorage.setItem("booking_bikeId", bikeId.toString());
    window.location.href = "/booking/bookings";
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/60 overflow-hidden p-6">
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-200/30 to-lime-200/20 blur-[100px] pointer-events-none" />
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">
              Доступные байки
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Пользователь: {username}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Начало аренды
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-white/60 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Конец аренды
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-white/60 text-xs"
            />
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {availableBikes.map((availableBike) => (
            <AvailableBikeItem
              key={availableBike.id}
              availableBike={availableBike}
              onBook={goToBooking}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AvailableBikeItem(props: {
  availableBike: AvailableBike;
  onBook: (bikeId: number) => void;
}) {
  const item = props.availableBike;
  return (
    <Card className="border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm rounded-2xl p-5 hover:shadow-md hover:border-emerald-500/30 transition-all duration-300">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-slate-800">{item.model}</h3>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
            ID {item.id}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100/80 py-3.5">
          <div>
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Год
            </span>
            <p className="font-bold text-slate-800 text-xs">{item.year}</p>
          </div>
          <div>
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Цена/час
            </span>
            <p className="font-bold text-slate-800 text-xs">{item.price} ₽</p>
          </div>
        </div>
        <Button
          onClick={() => props.onBook(item.id)}
          className="w-full px-4 h-9 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-500 text-xs font-bold text-white shadow-sm border-0"
        >
          Забронировать
        </Button>
      </CardContent>
    </Card>
  );
}

type AvailableBike = {
  id: number;
  model: string;
  year: number;
  availability: boolean;
  category: string;
  power: number;
  price: number;
};
type GetAllAvailableBikes = { availableBikes: AvailableBike[] };
