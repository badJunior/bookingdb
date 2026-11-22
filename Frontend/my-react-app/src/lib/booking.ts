export type BookingStatus = "Created" | "Paid" | "HandedOver" | "Completed" | "Cancelled";

export type ReceiptSummary = {
  id: number;
  status: string;
  amount: number;
  qrPayload: string | null;
  fiscalDocumentNumber: string | null;
  registeredAt: string | null;
};

export type BookingPhoto = { id: number; url: string };

export type BookingInspectionSummary = {
  phase: "Handover" | "Return";
  note: string | null;
  createdAt: string;
  photos: BookingPhoto[];
};

export type BookingDeliverySummary = {
  id: number;
  kind: "Dropoff" | "Pickup";
  status: string;
  addressLine: string;
  scheduledFrom: string;
  scheduledTo: string;
};

export type BookingListItem = {
  id: number;
  bikeId: number;
  bikeModel: string;
  bikeImageUrl: string | null;
  startDate: string;
  endDate: string;
  clientName: string;
  rentalPrice: number;
  deliveryFee: number;
  totalPrice: number;
  status: BookingStatus;
  handedOverAt: string | null;
  returnedAt: string | null;
  receipt: ReceiptSummary | null;
  handover: BookingInspectionSummary | null;
  return: BookingInspectionSummary | null;
  dropoff: BookingDeliverySummary | null;
  pickup: BookingDeliverySummary | null;
};

export type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
  sum: number;
};

export type ReceiptDetail = {
  id: number;
  bookingId: number;
  status: string;
  provider: string;
  amount: number;
  fiscalDriveNumber: string | null;
  fiscalDocumentNumber: string | null;
  fiscalSign: string | null;
  qrPayload: string | null;
  error: string | null;
  createdAt: string;
  registeredAt: string | null;
  items: ReceiptItem[];
};

export type InspectionPhotoDto = {
  id: number;
  url: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
};

export type BookingInspectionsResponse = {
  bookingId: number;
  bookingStatus: string;
  handover: {
    id: number;
    phase: string;
    note: string | null;
    createdAt: string;
    photos: InspectionPhotoDto[];
  } | null;
  return: {
    id: number;
    phase: string;
    note: string | null;
    createdAt: string;
    photos: InspectionPhotoDto[];
  } | null;
};

export const bookingStatusMeta: Record<BookingStatus, { label: string; className: string }> = {
  Created: { label: "Ожидает оплаты", className: "border-amber-200 bg-amber-50 text-amber-700" },
  Paid: { label: "Оплачено", className: "border-sky-200 bg-sky-50 text-sky-700" },
  HandedOver: { label: "В аренде", className: "border-lime-deep bg-lime/30 text-ink" },
  Completed: { label: "Завершена", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  Cancelled: { label: "Отменена", className: "border-slate-200 bg-slate-50 text-slate-600" },
};

export function apiUrl(path: string) {
  const base = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
  return `${base}${path}`;
}

export function photoSrc(path: string) {
  const token = localStorage.getItem("token") ?? "";
  return `${apiUrl(path)}?access_token=${encodeURIComponent(token)}`;
}

export function formatBookingRange(start: string, end: string) {
  const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Omsk",
  });

  return `${dateFormatter.format(new Date(start))} — ${dateFormatter.format(new Date(end))}`;
}
