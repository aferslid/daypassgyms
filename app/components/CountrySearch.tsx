"use client";

import { useState } from "react";

export default function CountrySearch() {
  const [query, setQuery] = useState("");

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search countries"
      className="w-full rounded-[8px] border border-[#E5E5E5] bg-white px-4 py-2.5 text-[12px] text-[#111] outline-none placeholder:text-[#bbb]"
    />
  );
}