import { useMutation, useQuery } from "@tanstack/react-query";
import { httpClient } from "../utils";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "./roleContext";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  PopoverContent,
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";

export default function Booking() {
  const { username } = useRole();
  const bikeIdFromLS = localStorage.getItem("booking_bikeId");
  const [bikeId, setBikeId] = useState<number>(Number(bikeIdFromLS) || 1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [clientName, setClientName] = useState(username || "");
  const [paymentType, setPaymentType] = useState("Card");
  const navigate = useNavigate();

  const formatDateForApi = (date: Date) => date.toISOString();

  const [pricePerHour, setPricePerHour] = useState<number>(0);

  const { data: bikesList } = useQuery({
    queryKey: ["allBikes"],
    queryFn: async () => {
      const response = await httpClient.get<GetAllBikesResponse>("/bikes");
      return response.data.allBikes;
    },
  });

  useEffect(() => {
    if (bikesList) {
      const selectedBike = bikesList.find((bike) => bike.id === bikeId);
      if (selectedBike) setPricePerHour(selectedBike.price);
    }
  }, [bikesList, bikeId]);

  const addBooking = useMutation({
    mutationFn: (newBooking: CreateBookingRequest) =>
      httpClient.post("/booking/bookings", newBooking),
    onSuccess: () => {
      alert("Бронь оформлена!");
      navigate("/booking/available-bikes");
    },
  });

  const goToPayment = async () => {
    if (!startDate || !endDate) {
      alert("Выберите даты!");
      return;
    }
    const diffHours =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.round(pricePerHour * diffHours);

    const response = await httpClient.post("/create-checkout-session", {
      bikeId: bikeId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      clientName: clientName,
      totalPrice: totalPrice,
      bookingId: 0,
    });

    window.location.href = response.data.url;
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/60 overflow-hidden p-6">
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        <Card className="border-slate-200/80 bg-white/70 backdrop-blur-xl rounded-3xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-800">
              Бронирование мотоцикла
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Заполните данные для аренды
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Байк ID
                </label>
                <input
                  type="number"
                  value={bikeId}
                  onChange={(e) => setBikeId(Number(e.target.value))}
                  className="h-10 rounded-xl border px-3 py-2 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Имя
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-10 rounded-xl border px-3 py-2 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Старт
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full justify-start rounded-xl text-xs"
                    >
                      <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
                      {startDate
                        ? format(startDate, "PPP", { locale: ru })
                        : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Конец
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full justify-start rounded-xl text-xs"
                    >
                      <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
                      {endDate
                        ? format(endDate, "PPP", { locale: ru })
                        : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Оплата
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full h-10 rounded-xl border px-3 text-xs"
                >
                  <option value="Card">Карта</option>
                  <option value="Cash">Наличные</option>
                </select>
              </div>
            </div>
            <Button
              onClick={() => {
                if (
                  !bikeId ||
                  !startDate ||
                  !endDate ||
                  !clientName ||
                  !pricePerHour
                ) {
                  alert("Заполните все поля!");
                  return;
                }
                if (paymentType === "Card") goToPayment();
                else
                  addBooking.mutate({
                    bikeId,
                    startDate: formatDateForApi(startDate),
                    endDate: formatDateForApi(endDate),
                    clientName,
                    paymentType,
                  });
              }}
              disabled={addBooking.isPending}
              className="w-full px-6 h-10 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-500 text-xs font-bold text-white border-0"
            >
              {addBooking.isPending ? "Отправка..." : "Забронировать"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type CreateBookingRequest = {
  bikeId: number;
  startDate: string;
  endDate: string;
  clientName: string;
  paymentType: string;
};
type GetAllBikesResponse = { allBikes: { id: number; price: number }[] };
