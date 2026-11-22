export type DeliveryKind = "Dropoff" | "Pickup";

export type DeliveryStatus =
  | "Pending"
  | "Assigned"
  | "EnRoute"
  | "Arrived"
  | "Completed"
  | "Cancelled"
  | "Failed";

export type CourierStatus = "Offline" | "Available" | "Busy";

export type DeliveryDto = {
  id: number;
  bookingId: number;
  courierId: number | null;
  courierName: string;
  courierPhone: string;
  kind: DeliveryKind;
  status: DeliveryStatus;
  addressLine: string;
  latitude: number;
  longitude: number;
  scheduledFrom: string;
  scheduledTo: string;
  distanceKm: number;
  fee: number;
  bikeId: number;
  bikeModel: string;
  clientName: string;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
};

export type CourierDto = {
  id: number;
  userId: number;
  username: string;
  email: string;
  phone: string;
  isApproved: boolean;
  status: CourierStatus;
  latitude: number | null;
  longitude: number | null;
  lastLocationAt: string | null;
};

export type DeliveryOptionsDto = {
  shopLatitude: number;
  shopLongitude: number;
  mapCenterLatitude: number;
  mapCenterLongitude: number;
  baseFee: number;
  perKmRate: number;
  maxDistanceKm: number;
  pickupWindowHours: number;
};

export type FeePreviewDto = {
  distanceKm: number;
  fee: number;
  baseFee: number;
  perKmRate: number;
  withinRange: boolean;
};

export const deliveryStatusMeta: Record<
  DeliveryStatus,
  { label: string; className: string; dot: string }
> = {
  Pending: {
    label: "Ищем курьера",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  Assigned: {
    label: "Назначен",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  EnRoute: {
    label: "В пути",
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
  Arrived: {
    label: "На месте",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  Completed: {
    label: "Выполнено",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  Cancelled: {
    label: "Отменено",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
  Failed: {
    label: "Не выполнено",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
};

export const courierStatusMeta: Record<
  CourierStatus,
  { label: string; className: string; dot: string }
> = {
  Offline: {
    label: "Не на линии",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
  Available: {
    label: "Готов к заказам",
    className: "border-lime-deep/40 bg-lime/25 text-forest",
    dot: "bg-lime-deep",
  },
  Busy: {
    label: "Везёт заказ",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
};

export function kindLabel(kind: DeliveryKind) {
  return kind === "Dropoff" ? "Доставка мотоцикла" : "Забор мотоцикла";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Omsk",
  }).format(new Date(value));
}

export function formatWindow(from: string, to: string) {
  return `${formatDateTime(from)} — ${formatDateTime(to)}`;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDistance(km: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(km)} км`;
}

export const terminalStatuses: DeliveryStatus[] = ["Completed", "Cancelled", "Failed"];
