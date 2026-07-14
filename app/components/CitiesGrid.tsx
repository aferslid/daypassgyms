"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CitySearch from "./CitySearch";

type CityEntry = [string, number];

type Props = {
  cities: CityEntry[];
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
  countrySlug,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredCities = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return cities;
    }

    return cities.filter(([city]) =>
      city.toLowerCase().includes(normalizedSearch)
    );
  }, [cities, search]);

  return (
    <>
      <div className="mb-6 max-w-md">
        <CitySearch
          value={search}
          onChange={setSearch}
        />
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

            <div>
              <div className="text-[13px] font-bold tracking-[-0.2px] text-[#111]">
                {city}
              </div>

              <div className="text-[11px] text-[#999]">
                {count} gym{count > 1 ? "s" : ""}
              </div>
            </div>

            <span className="text-[#ccc] transition-all group-hover:translate-x-0.5 group-hover:text-[#C8F135]">
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
          No cities found for “{search}”.
        </div>
      )}
    </>
  );
}