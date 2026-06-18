"use client";

import dynamic from "next/dynamic";

const GymMiniMap = dynamic(() => import("./GymMiniMap"), {
  ssr: false,
});

export default function GymMiniMapClient({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  return <GymMiniMap lat={lat} lng={lng} />;
}