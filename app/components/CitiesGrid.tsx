"use client";

import { useState } from "react";
import Link from "next/link";
import CitySearch from "./CitySearch";

type CityEntry = [string, number];

type Props = {
  cities: CityEntry[];
  countryName: string;
  countrySlug: string;
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

export default function CitiesGrid({
  cities,
  countryName,
  countrySlug,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredCities = cities.filter(([city]) =>
    city.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Cities
          </p>

          <h2
            className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Cities in {countryName}
          </h2>

          <p className="mt-1 text-[13px] text-[#999]">
            Browse every city currently listed
          </p>
        </div>

        <div className="w-full md:w-[240px]">
          <CitySearch value={query} onChange={setQuery} />
        </div>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns:
            "repeat(auto-fill, minmax(210px, 1fr))",
        }}
      >
        {filteredCities.map(([city, count]) => (
          <Link
            key={city}
            href={`/gyms/${countrySlug}/${slugify(city)}`}
            className="group relative flex items-center justify-between overflow-hidden rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 transition duration-150 hover:-translate-y-0.5 hover:border-[#C8F135]"
          >
            <span className="absolute inset-y-0 left-0 w-[3px] bg-[#C8F135] opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold tracking-[-0.2px] text-[#111]">
                {city}
              </div>

              <div className="text-[11px] text-[#999]">
                {count} gym{count > 1 ? "s" : ""}
              </div>
            </div>

            <span className="flex-shrink-0 text-[#ccc] transition-all group-hover:translate-x-0.5 group-hover:text-[#C8F135]">
              →
            </span>

            <span
              className="pointer-events-none absolute -bottom-2 right-0 select-none text-[44px] font-extrabold leading-none tracking-[-2px] text-[#F0F0EE]"
              aria-hidden="true"
            >
              {count}
            </span>
          </Link>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <div className="rounded-[14px] border border-[#EBEBEB] bg-white p-6 text-[13px] text-[#777]">
          No cities found for “{query}”.
        </div>
      )}
    </>
  );
}