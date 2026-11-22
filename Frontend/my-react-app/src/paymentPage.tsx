import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { httpClient } from "./utils";
import { formatMoney } from "@/lib/delivery";

type PendingBooking = {
  bookingId: number;
  totalPrice: number;
  rentalPrice: number;
  deliveryFee: number;
  hasDelivery: boolean;
};

function readPending(): PendingBooking | null {
  try {
    const raw = sessionStorage.getItem("pendingBooking");
    return raw ? (JSON.parse(raw) as PendingBooking) : null;
  } catch {
    return null;
  }
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [pending] = useState<PendingBooking | null>(() => readPending());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const pay = async () => {
    if (!pending) return;

    setError("");
    setIsLoading(true);

    try {
      await httpClient.post("/booking/create-emulated-payment", {
        bookingId: pending.bookingId,
        totalPrice: pending.totalPrice,
      });

      sessionStorage.removeItem("pendingBooking");
      setDone(true);
      setTimeout(() => navigate("/my-bookings"), 1400);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Не удалось провести оплату.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
      <div className="relative w-full max-w-4xl animate-reveal">
        <Link
          to="/booking/available-bikes"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Назад к каталогу
        </Link>

        {!pending ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-black tracking-tight">Нет брони для оплаты</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Сначала оформите аренду — после этого здесь появится сумма к оплате.
            </p>
            <Link
              to="/booking/available-bikes"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-forest px-5 text-sm font-semibold text-paper transition hover:bg-ink/80"
            >
              Выбрать мотоцикл
            </Link>
          </div>
        ) : done ? (
          <div className="rounded-2xl border border-lime-deep/30 bg-card p-10 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime/30 text-forest animate-pulse-ring">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-2xl font-black tracking-tight">Оплата прошла</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Бронь #{pending.bookingId} оплачена. Переходим к доставкам…
            </p>
            <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-forest" />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-forest p-7 text-paper">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-paper/40">
                  К оплате
                </p>
                <p className="mt-3 text-5xl font-black tracking-tight">
                  {formatMoney(pending.totalPrice)}
                </p>
                <p className="mt-2 text-xs text-paper/45">Бронь #{pending.bookingId}</p>
              </div>

              <div className="mt-8 space-y-3 border-t border-white/10 pt-5 text-xs">
                <SummaryRow label="Аренда" value={formatMoney(pending.rentalPrice)} />
                <SummaryRow
                  label="Доставка и забор"
                  value={pending.hasDelivery ? formatMoney(pending.deliveryFee) : "0 ₽"}
                />
                <SummaryRow label="Способ" value="Картой онлайн" />
              </div>

              <p className="mt-8 flex items-start gap-2 text-[11px] leading-relaxed text-paper/40">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" />
                Это эмуляция оплаты для демо: реальные деньги не списываются.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/30 text-forest">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">Данные карты</h1>
                  <p className="text-[11px] text-muted-foreground">
                    Тестовый режим, можно вводить любые данные
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <label className="space-y-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Номер карты
                  </span>
                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      className="h-12 w-full rounded-2xl border border-border bg-paper/60 pl-11 pr-4 font-mono text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                    />
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Срок
                    </span>
                    <input
                      placeholder="12/34"
                      className="h-12 w-full rounded-2xl border border-border bg-paper/60 px-4 font-mono text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      CVC
                    </span>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        inputMode="numeric"
                        placeholder="123"
                        className="h-12 w-full rounded-2xl border border-border bg-paper/60 pl-11 pr-4 font-mono text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
                      />
                    </div>
                  </label>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={pay}
                  disabled={isLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-forest text-sm font-bold text-paper transition-all hover:bg-ink/80 active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Обрабатываем...
                    </>
                  ) : (
                    <>Оплатить {formatMoney(pending.totalPrice)}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-paper/50">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
