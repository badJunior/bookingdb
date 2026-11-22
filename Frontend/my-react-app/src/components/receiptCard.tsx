import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ReceiptText } from "lucide-react";
import { httpClient } from "../utils";
import type { ReceiptDetail } from "@/lib/booking";
import { formatDateTime, formatMoney } from "@/lib/delivery";

export function ReceiptCard({
  bookingId,
  open,
}: {
  bookingId: number;
  open: boolean;
}) {
  const receiptQuery = useQuery({
    queryKey: ["receipt", bookingId],
    queryFn: async () => {
      const response = await httpClient.get<ReceiptDetail>(`/bookings/${bookingId}/receipt`);
      return response.data;
    },
    enabled: open,
    retry: false,
  });

  if (!open) return null;

  if (receiptQuery.isPending) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        Загружаем чек…
      </div>
    );
  }

  if (receiptQuery.error) {
    const status = (receiptQuery.error as any).response?.status;
    return (
      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        {status === 404
          ? "Чек ещё не сформирован. Он появится после оплаты."
          : "Не удалось загрузить чек."}
      </div>
    );
  }

  const receipt = receiptQuery.data;

  return (
    <div className="mt-4 rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime text-ink">
            <ReceiptText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold">Фискальный чек</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {receipt.provider} · {receipt.status}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
        >
          <Printer className="h-3.5 w-3.5" /> Печать
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        {receipt.items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-start justify-between gap-4 border-b border-border/70 px-3 py-2 last:border-0"
          >
            <div>
              <p className="text-xs font-medium">{item.name}</p>
              <p className="font-mono text-[9px] text-muted-foreground">
                {item.quantity} × {formatMoney(item.price)}
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold">{formatMoney(item.sum)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Итого</span>
        <span className="text-base font-black">{formatMoney(receipt.amount)}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <dl className="grid min-w-0 gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          <div className="flex justify-between gap-4">
            <dt className="shrink-0">ФН</dt>
            <dd className="truncate text-right">{receipt.fiscalDriveNumber ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="shrink-0">ФД</dt>
            <dd className="truncate text-right">{receipt.fiscalDocumentNumber ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="shrink-0">ФП</dt>
            <dd className="truncate text-right">{receipt.fiscalSign ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="shrink-0">Дата</dt>
            <dd className="truncate text-right">
              {receipt.registeredAt ? formatDateTime(receipt.registeredAt) : "—"}
            </dd>
          </div>
        </dl>

        {receipt.qrPayload && (
          <div className="flex items-center justify-center rounded-lg border border-border p-2">
            <QRCodeSVG value={receipt.qrPayload} size={96} bgColor="#ffffff" fgColor="#0a0a0a" />
          </div>
        )}
      </div>
    </div>
  );
}
