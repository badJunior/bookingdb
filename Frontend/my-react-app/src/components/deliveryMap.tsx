import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { cn } from "@/lib/utils";

export type MapMarkerTone = "shop" | "dropoff" | "pickup" | "courier" | "picked";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  tone?: MapMarkerTone;
};

const toneColor: Record<MapMarkerTone, string> = {
  shop: "#173f2b",
  dropoff: "#173f2b",
  pickup: "#e2704a",
  courier: "#2563eb",
  picked: "#d8f36b",
};

function createIcon(tone: MapMarkerTone) {
  const color = toneColor[tone];
  const textColor = tone === "picked" ? "#12160f" : "#ffffff";

  return L.divIcon({
    className: "bikebooking-marker",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 6px 16px rgba(18,22,15,.35);color:${textColor};font-size:10px;font-weight:800;font-family:monospace;">${
      tone === "shop" ? "S" : tone === "courier" ? "C" : ""
    }</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

function ClickCatcher({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function FocusPicked({ picked }: { picked?: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (picked) {
      map.setView([picked.lat, picked.lng], Math.max(map.getZoom(), 14), {
        animate: true,
      });
    }
  }, [picked, map]);

  return null;
}

type DeliveryMapProps = {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  picked?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  className?: string;
};

export default function DeliveryMap({
  center,
  zoom = 12,
  markers = [],
  picked,
  onPick,
  className,
}: DeliveryMapProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80",
        onPick && "cursor-crosshair",
        className,
      )}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ minHeight: "16rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickCatcher onPick={onPick} />
        <FocusPicked picked={picked} />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createIcon(marker.tone ?? "dropoff")}
          >
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}

        {picked && (
          <Marker position={[picked.lat, picked.lng]} icon={createIcon("picked")}>
            <Popup>Точка доставки</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
