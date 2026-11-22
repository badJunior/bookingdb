import { useRef, useState } from "react";
import { Camera, Check, Loader2, Trash2, X } from "lucide-react";
import { httpClient } from "../utils";
import { photoSrc, apiUrl, type BookingPhoto, type InspectionPhotoDto } from "@/lib/booking";

const MIN_PHOTOS = 4;
const MAX_PHOTOS = 12;

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.82);
  });
}

type InspectionPanelProps = {
  bookingId: number;
  phase: "Handover" | "Return";
  initialPhotos?: BookingPhoto[];
  initialNote?: string | null;
  onClose: () => void;
  onDone: () => void;
};

export function InspectionPanel({
  bookingId,
  phase,
  initialPhotos = [],
  initialNote,
  onClose,
  onDone,
}: InspectionPanelProps) {
  const [photos, setPhotos] = useState<BookingPhoto[]>(initialPhotos);
  const [note, setNote] = useState(initialNote ?? "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const phaseParam = phase.toLowerCase();
  const title = phase === "Handover" ? "Фото при получении" : "Фото при возврате";
  const canSubmit = photos.length >= MIN_PHOTOS && !uploading;

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (photos.length >= MAX_PHOTOS) break;

        const blob = await compressImage(file);
        const formData = new FormData();
        formData.append("file", blob, "photo.jpg");

        const token = localStorage.getItem("token") ?? "";
        const response = await fetch(
          apiUrl(`/bookings/${bookingId}/inspections/${phaseParam}/photos`),
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: formData,
          },
        );

        if (!response.ok) {
          let message = "Не удалось загрузить фото.";
          try {
            const payload = await response.json();
            message = payload.error || message;
          } catch {
            // keep the default message
          }
          throw new Error(message);
        }

        const photo = (await response.json()) as InspectionPhotoDto;
        setPhotos((previous) => [...previous, { id: photo.id, url: photo.url }]);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Не удалось загрузить фото.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePhoto = async (photo: BookingPhoto) => {
    setError("");
    try {
      await httpClient.delete(
        `/bookings/${bookingId}/inspections/${phaseParam}/photos/${photo.id}`,
      );
      setPhotos((previous) => previous.filter((item) => item.id !== photo.id));
    } catch (err: any) {
      setError(err.response?.data?.error || "Не удалось удалить фото.");
    }
  };

  const submit = async () => {
    setError("");
    setSubmitting(true);

    try {
      await httpClient.post(`/bookings/${bookingId}/inspections/${phaseParam}/submit`, { note });
      onDone();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Не удалось подтвердить фото.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Минимум {MIN_PHOTOS} фото: спереди, сзади, слева и справа. До {MAX_PHOTOS}.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted"
          aria-label="Закрыть"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => uploadFiles(event.target.files)}
      />

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img
              src={photoSrc(photo.url)}
              alt="Фото мотоцикла"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(photo)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Удалить фото"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-lime-deep hover:bg-lime/10 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
              {uploading ? "Грузим" : "Добавить"}
            </span>
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className={photos.length >= MIN_PHOTOS ? "text-emerald-600" : "text-muted-foreground"}>
          {photos.length} / {MIN_PHOTOS} минимум
        </span>
        {photos.length >= MIN_PHOTOS && (
          <span className="flex items-center gap-1 text-emerald-600">
            <Check className="h-3 w-3" /> Достаточно фото
          </span>
        )}
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        placeholder="Комментарий к состоянию (царапины, сколы и т.п.) — необязательно"
        className="mt-4 w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/40"
      />

      {error && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || submitting}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-xs font-bold text-white transition hover:bg-ink/80 disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Подтверждаем…
            </>
          ) : phase === "Handover" ? (
            "Подтвердить получение"
          ) : (
            "Подтвердить возврат"
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-xs font-semibold transition hover:bg-muted"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
