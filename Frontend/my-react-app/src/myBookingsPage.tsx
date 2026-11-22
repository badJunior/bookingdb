import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { httpClient } from "./utils";
import { PageShell } from "./components/pageShell";
import { Reveal } from "./components/reveal";
import { ReceiptCard } from "./components/receiptCard";
import { InspectionPanel } from "./components/inspectionPanel";
import {
  bookingStatusMeta,
  formatBookingRange,
  photoSrc,
  type BookingListItem,
} from "@/lib/booking";
import { formatMoney } from "@/lib/delivery";
import { cn } from "@/lib/utils";

type OpenPanel = { bookingId: number; phase: "Handover" | "Return" } | null;

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<OpenPanel>(null);
  const [openReceipt, setOpenReceipt] = useState<number | null>(null);

  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await httpClient.get<BookingListItem[]>("/bookings");
      return response.data;
    },
    refetchInterval: 15000,
  });

  const bookings = bookingsQuery.data ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    setPanel(null);
  };

  return (
    <PageShell
      eyebrow="Аренда"
      title="Мои аренды"
      description="Фотофиксация при получении и возврате, статус аренды и фискальный чек — всё в одном месте."
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
      {bookingsQuery.isPending && (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-ink" />
        </div>
      )}

      {bookingsQuery.error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Не удалось загрузить аренды.
        </div>
      )}

      {!bookingsQuery.isPending && bookings.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Bike className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-bold">Аренд пока нет</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Оформите бронь — здесь появятся фото, статус и чек.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {bookings.map((booking, index) => {
          const meta = bookingStatusMeta[booking.status];
          const deliveryPending =
            booking.dropoff != null && booking.dropoff.status !== "Completed";
          const isOpen = panel?.bookingId === booking.id;

          return (
            <Reveal key={booking.id} delay={index * 50}>
              <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                      {booking.bikeImageUrl ? (
                        <img
                          src={booking.bikeImageUrl}
                          alt={booking.bikeModel}
                          loading="lazy"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Bike className="h-6 w-6 text-muted-foreground" />
                      )}
                    </span>
                    <div>
                      <h2 className="text-lg font-black tracking-tight">{booking.bikeModel}</h2>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Аренда #{booking.id} · {formatBookingRange(booking.startDate, booking.endDate)}
                      </p>
                    </div>
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

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs">
                  <span className="text-muted-foreground">
                    Итого: <span className="font-bold text-ink">{formatMoney(booking.totalPrice)}</span>
                  </span>
                  {booking.dropoff && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {booking.dropoff.addressLine}
                    </span>
                  )}
                  {booking.handedOverAt && (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Получен
                    </span>
                  )}
                </div>

                <PhotoStrip
                  title="Фото при получении"
                  photos={booking.handover?.photos ?? []}
                />
                <PhotoStrip
                  title="Фото при возврате"
                  photos={booking.return?.photos ?? []}
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  {booking.status === "Paid" && (
                    <button
                      type="button"
                      onClick={() =>
                        setPanel({ bookingId: booking.id, phase: "Handover" })
                      }
                      disabled={deliveryPending}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-xs font-bold text-white transition hover:bg-ink/80 disabled:opacity-40"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      {deliveryPending ? "Ждём доставку" : "Получил мотоцикл"}
                    </button>
                  )}

                  {booking.status === "HandedOver" && (
                    <button
                      type="button"
                      onClick={() => setPanel({ bookingId: booking.id, phase: "Return" })}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-xs font-bold text-white transition hover:bg-ink/80"
                    >
                      <ClipboardCheck className="h-4 w-4" /> Вернул мотоцикл
                    </button>
                  )}

                  {booking.receipt && (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenReceipt((current) =>
                          current === booking.id ? null : booking.id,
                        )
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold transition hover:border-lime-deep hover:bg-lime/10"
                    >
                      <FileText className="h-4 w-4" />
                      {openReceipt === booking.id ? "Скрыть чек" : "Чек"}
                    </button>
                  )}
                </div>

                {isOpen && (
                  <InspectionPanel
                    bookingId={booking.id}
                    phase={panel.phase}
                    initialPhotos={(panel.phase === "Handover"
                      ? booking.handover?.photos
                      : booking.return?.photos) ?? []}
                    initialNote={panel.phase === "Handover" ? booking.handover?.note : booking.return?.note}
                    onClose={() => setPanel(null)}
                    onDone={refresh}
                  />
                )}

                <ReceiptCard bookingId={booking.id} open={openReceipt === booking.id} />
              </article>
            </Reveal>
          );
        })}
      </div>
    </PageShell>
  );
}

function PhotoStrip({ title, photos }: { title: string; photos: { id: number; url: string }[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {title} · {photos.length}
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {photos.map((photo) => (
          <a
            key={photo.id}
            href={photoSrc(photo.url)}
            target="_blank"
            rel="noreferrer"
            className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
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
