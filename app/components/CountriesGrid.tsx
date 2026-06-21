"use client";

import { useState } from "react";
import Link from "next/link";
import CountrySearch from "./CountrySearch";

type Country = {
  code: string;
  name: string;
  slug: string;
  flag: string;
  count: number;
};

export default function CountriesGrid({ countries }: { countries: Country[] }) {
  const [query, setQuery] = useState("");

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
        <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <p
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                Directory
                </p>

                <h2
                className="mt-1 text-[22px] font-extrabold text-[#0C0C0C] tracking-[-0.5px]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                All countries
                </h2>

                <p className="mt-1 text-[13px] text-[#999]">
                Browse every country currently listed
                </p>
            </div>

            <div className="w-full md:w-[240px]">
                <CountrySearch value={query} onChange={setQuery} />
            </div>
            </div>

            <div
            className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
      >
        {filteredCountries.map((country) => (
          <Link
            key={country.code}
            href={`/gyms/${country.slug}`}
            className="group relative flex items-center gap-3 overflow-hidden rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 transition duration-150 hover:-translate-y-0.5 hover:border-[#C8F135]"
          >
            <span className="absolute inset-y-0 left-0 w-[3px] bg-[#C8F135] opacity-0 transition-opacity group-hover:opacity-100" />

            <img
              src={country.flag}
              alt={`${country.name} flag`}
              className="h-[22px] w-8 flex-shrink-0 rounded-[3px] object-cover"
            />

            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-[#111] tracking-[-0.2px]">
                {country.name}
              </div>
              <div className="text-[11px] text-[#999]">
                {country.count} gym{country.count > 1 ? "s" : ""}
              </div>
            </div>

            <span className="flex-shrink-0 text-[#ccc] transition-all group-hover:translate-x-0.5 group-hover:text-[#C8F135]">
              →
            </span>

            <span className="pointer-events-none absolute -bottom-2 right-0 text-[44px] font-extrabold leading-none tracking-[-2px] text-[#F0F0EE] select-none">
              {country.count}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}