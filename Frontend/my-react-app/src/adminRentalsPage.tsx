import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, RefreshCw, RotateCcw, UserRound } from "lucide-react";
import { httpClient } from "./utils";
import { PageShell } from "./components/pageShell";
import { ReceiptCard } from "./components/receiptCard";
import {
  bookingStatusMeta,
  formatBookingRange,
  photoSrc,
  type BookingListItem,
} from "@/lib/booking";
import { formatMoney } from "@/lib/delivery";
import { cn } from "@/lib/utils";

export default function AdminRentalsPage() {
  const queryClient = useQueryClient();
  const [openReceipt, setOpenReceipt] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const bookingsQuery = useQuery({
    queryKey: ["adminBookings"],
    queryFn: async () => {
      const response = await httpClient.get<BookingListItem[]>("/bookings");
      return response.data;
    },
    refetchInterval: 20000,
  });

  const retryMutation = useMutation({
    mutationFn: async (receiptId: number) => {
      await httpClient.post(`/receipts/${receiptId}/retry`);
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (error: any) =>
      setMessage(error.response?.data?.error || "Не удалось повторить фискализацию."),
  });

  const bookings = bookingsQuery.data ?? [];

  return (
    <PageShell
      eyebrow="Аренды"
      title="Аренды и чеки"
      description="Все брони: статусы, фото «до/после» и фискальные чеки. Можно повторно отправить чек на регистрацию."
      actions={
        <button
          type="button"
          onClick={() => bookingsQuery.refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-lime-deep"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", bookingsQuery.isFetching && "animate-spin")} />
          Обновить
        </button>
      }
    >
      {message && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {message}
        </div>
      )}

      {bookingsQuery.isPending && (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin" />
        </div>
      )}

      <div className="grid gap-4">
        {bookings.map((booking) => {
          const meta = bookingStatusMeta[booking.status];

          return (
            <article key={booking.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black tracking-tight">
                    {booking.bikeModel} · #{booking.id}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <UserRound className="h-3 w-3" />
                    {booking.clientName} · {formatBookingRange(booking.startDate, booking.endDate)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                    meta.className,
                  )}
                >
                  {meta.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-xs">
                <span>
                  Сумма: <b>{formatMoney(booking.totalPrice)}</b>
                </span>
                <span className="text-muted-foreground">
                  Чек: <b className="text-ink">{booking.receipt?.status ?? "нет"}</b>
                </span>
                <span className="text-muted-foreground">
                  Фото: {booking.handover?.photos.length ?? 0} до /{" "}
                  {booking.return?.photos.length ?? 0} после
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <AdminPhotoRow title="До" photos={booking.handover?.photos ?? []} />
                <AdminPhotoRow title="После" photos={booking.return?.photos ?? []} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {booking.receipt && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenReceipt((current) =>
                        current === booking.id ? null : booking.id,
                      )
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold transition hover:border-lime-deep hover:bg-lime/10"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {openReceipt === booking.id ? "Скрыть чек" : "Открыть чек"}
                  </button>
                )}

                {booking.receipt?.status === "Failed" && (
                  <button
                    type="button"
                    onClick={() => retryMutation.mutate(booking.receipt!.id)}
                    disabled={retryMutation.isPending}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-3 text-xs font-semibold text-white transition hover:bg-ink/80 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Повторить фискализацию
                  </button>
                )}
              </div>

              <ReceiptCard bookingId={booking.id} open={openReceipt === booking.id} />
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}

function AdminPhotoRow({ title, photos }: { title: string; photos: { id: number; url: string }[] }) {
  if (photos.length === 0) return null;

  return (
    <div>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {title} · {photos.length}
      </p>
      <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
        {photos.map((photo) => (
          <a
            key={photo.id}
            href={photoSrc(photo.url)}
            target="_blank"
            rel="noreferrer"
            className="h-14 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
          >
            <img
              src={photoSrc(photo.url)}
              alt="Фото мотоцикла"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
