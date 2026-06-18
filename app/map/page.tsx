"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("../components/GymMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="h-screen w-full">
      <Map />
    </main>
  );
}