"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function GymMiniMap({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  return (
    <div className="mb-4 h-[260px] w-full overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-200">
        <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
        >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} />
        </MapContainer>
    </div>
    );
}