"use client";

import { useState } from "react";
import Link from "next/link";

type Country = {
  code: string;
  slug: string;
  name: string;
  count: number;
  flag: string;
};

export default function CountrySearch({ countries }: { countries: Country[] }) {
  const [query, setQuery] = useState("");

  const filtered = countries.filter((country) =>
    country.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search countries"
        className="w-full rounded-[8px] border border-[#E5E5E5] bg-white px-4 py-2.5 text-[13px] text-[#111] outline-none"
      />

      <div
        className="mt-6 grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
      >
        {filtered.map((country) => (
          <Link
            key={country.code}
            href={`/gyms/${country.slug}`}
            className="group relative flex items-center gap-3 overflow-hidden rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 transition duration-200 hover:border-[#C8F135]"
          >
            <div className="absolute inset-y-0 left-0 w-[3px] bg-[#C8F135] opacity-0 transition-opacity group-hover:opacity-100" />

            <img
            src={country.flag}
            alt={`${country.name} flag`}
            className="h-[22px] w-8 flex-shrink-0 rounded-[3px] object-cover"
            />

            <div>
              <div className="text-[15px] font-bold text-[#111]">
                {country.name}
              </div>
              <div className="text-[12px] text-[#777]">
                {country.count} gyms
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}