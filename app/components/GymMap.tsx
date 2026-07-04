"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";

type Spot = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  photo_url?: string | null;
  created_at?: string | null;
  details?: Record<string, any> | null;
  country?: string | null;
};

type MapMarker = {
  kind: "spot" | "cluster";
  id: number | null;
  name: string | null;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  photo_url: string | null;
  point_count: number;
  details?: Record<string, any> | null;
  created_at?: string | null;
  country?: string | null;
};

function slugify(text: string) {
  return text
    .replace(/ß/g, "ss")
    .replace(/ẞ/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(details: Spot["details"]) {
  if (!details?.day_pass_price) return "Price unknown";
  return `${new Intl.NumberFormat().format(details.day_pass_price)} ${
    details.currency || ""
  }`;
}

function formatShower(details: Spot["details"]) {
  if (details?.shower === true) return "Shower available";
  if (details?.shower === false) return "No shower";
  return "Shower unknown";
}

function MapBoundsUpdater({
  setBounds,
  setZoomLevel,
}: {
  setBounds: any;
  setZoomLevel: any;
}) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      setBounds({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    },
    zoomend: () => {
      setZoomLevel(map.getZoom());
    },
  });

  return null;
}

export default function GymMap() {
  const mapRef = useRef<L.Map | null>(null);

  const [bounds, setBounds] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchMarkers = async () => {
      if (!bounds) return;

      setIsLoading(true);

      const { data, error } = await supabase.rpc("get_map_markers", {
        min_lat: bounds.south,
        min_lng: bounds.west,
        max_lat: bounds.north,
        max_lng: bounds.east,
        zoom_level: zoomLevel,
        spot_type: "gym",
      });

      if (error) {
        console.error(error);
        setIsLoading(false);
        return;
      }

      const nextMarkers = (data || []) as MapMarker[];
      setMarkers(nextMarkers);

      const realSpots = nextMarkers
        .filter((m) => m.kind === "spot" && m.id !== null)
        .map((m) => ({
          id: m.id as number,
          name: m.name || "",
          type: m.type,
          lat: m.lat,
          lng: m.lng,
          description: m.description,
          photo_url: m.photo_url,
          details: m.details,
          created_at: m.created_at,
          country: m.country,
        }));

      setSpots(realSpots);
      setIsLoading(false);
    };

    const timeout = setTimeout(fetchMarkers, 250);
    return () => clearTimeout(timeout);
  }, [bounds, zoomLevel]);

  const recenterOnUser = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setUserPosition(coords);
      mapRef.current?.setView([coords.lat, coords.lng], 13);
    });
  };

  const worldView = () => {
    mapRef.current?.fitBounds([
      [-60, -180],
      [85, 180],
    ]);
  };

  const gymIcon = (selected = false) =>
    L.divIcon({
      html: `
        <div style="
          width:${selected ? 42 : 34}px;
          height:${selected ? 42 : 34}px;
          border-radius:14px;
          background:#C8F135;
          border:3px solid #0C0C0C;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${selected ? 20 : 16}px;
          box-shadow:0 10px 24px rgba(0,0,0,0.25);
        ">🏋️</div>
      `,
      className: "",
      iconSize: [selected ? 42 : 34, selected ? 42 : 34],
      iconAnchor: [selected ? 21 : 17, selected ? 21 : 17],
    });

  const clusterIcon = (count: number) =>
    L.divIcon({
      html: `
        <div style="
          width:46px;
          height:46px;
          border-radius:16px;
          background:#0C0C0C;
          border:3px solid #C8F135;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#C8F135;
          font-weight:900;
          font-size:14px;
          box-shadow:0 10px 24px rgba(0,0,0,0.25);
        ">${count}</div>
      `,
      className: "",
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden font-[family-name:var(--font-space)]">
      <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center justify-between rounded-[14px] border border-[#1e1e1e] bg-[#0C0C0C]/95 px-4 py-3 text-white shadow-2xl backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#C8F135] text-lg">
            🏋️
          </span>
          <span className="text-sm font-bold">Gym Day Pass Map</span>
        </Link>

        <div className="hidden items-center gap-5 text-[13px] text-[#777] md:flex">
          <Link href="/gyms" className="hover:text-white">Explore</Link>
          <Link href="/gyms" className="hover:text-white">Countries</Link>
        </div>

        <div className="flex gap-2">
          <button
            onClick={recenterOnUser}
            className="rounded-[8px] bg-[#C8F135] px-3 py-2 text-[12px] font-bold text-[#0C0C0C]"
          >
            Center me
          </button>

          <button
            onClick={worldView}
            className="hidden rounded-[8px] border border-[#2a2a2a] px-3 py-2 text-[12px] font-bold text-[#888] hover:text-white sm:block"
          >
            World
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="absolute left-1/2 top-20 z-[1000] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-[12px] font-bold text-[#111] shadow-xl">
          Loading gyms...
        </div>
      )}

      <MapContainer
        center={[20, 0]}
        zoom={3}
        scrollWheelZoom
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater setBounds={setBounds} setZoomLevel={setZoomLevel} />

        {userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={L.divIcon({
              className: "",
              html: `<div style="width:18px;height:18px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 8px rgba(37,99,235,.25);"></div>`,
            })}
          />
        )}

        {markers.map((marker, index) => {
          if (marker.kind === "cluster") {
            return (
              <Marker
                key={`cluster-${index}`}
                position={[marker.lat, marker.lng]}
                icon={clusterIcon(marker.point_count)}
                eventHandlers={{
                  click: () => {
                    mapRef.current?.setView(
                      [marker.lat, marker.lng],
                      Math.min(zoomLevel + 2, 18)
                    );
                  },
                }}
              />
            );
          }

          const spot = spots.find((s) => s.id === marker.id);
          if (!spot) return null;

          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={gymIcon(selectedSpot?.id === spot.id)}
              eventHandlers={{
                click: () => setSelectedSpot(spot),
              }}
            />
          );
        })}
      </MapContainer>

      <div className="absolute bottom-5 left-5 z-[1000] rounded-[12px] border border-[#EBEBEB] bg-white px-4 py-3 shadow-xl">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999]">
          Showing
        </div>
        <div className="text-[15px] font-extrabold text-[#111]">🏋️ Gyms only</div>
      </div>

      {selectedSpot && (
        <div className="absolute bottom-5 left-1/2 z-[1000] w-[92vw] max-w-sm -translate-x-1/2 rounded-[16px] border border-[#EBEBEB] bg-white p-4 shadow-2xl">
          <button
            onClick={() => setSelectedSpot(null)}
            className="absolute right-3 top-3 text-[#999] hover:text-black"
          >
            ×
          </button>

          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
            Gym
          </p>

          <h2 className="mt-1 pr-8 text-[20px] font-extrabold tracking-[-0.5px] text-[#111]">
            {selectedSpot.name}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-[#F2F2F0] px-3 py-1 text-[#555]">
              💰 {formatPrice(selectedSpot.details)}
            </span>

            <span className="rounded-full bg-[#F2F2F0] px-3 py-1 text-[#555]">
              🚿 {formatShower(selectedSpot.details)}
            </span>
          </div>

          {selectedSpot.photo_url && (
            <img
              src={selectedSpot.photo_url}
              alt={selectedSpot.name}
              className="mt-4 h-36 w-full rounded-[12px] object-cover"
            />
          )}

          <div className="mt-4 grid gap-2">
            <Link
              href={`/gym/${slugify(selectedSpot.name)}-${selectedSpot.id}`}
              className="rounded-[10px] bg-[#0C0C0C] px-4 py-3 text-center text-[13px] font-bold text-white"
            >
              View gym →
            </Link>

            <a
              href={`https://www.google.com/maps?q=${selectedSpot.lat},${selectedSpot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[10px] border border-[#EBEBEB] px-4 py-3 text-center text-[13px] font-bold text-[#111]"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}