"use client";

export default function CountrySearch() {
  return (
    <div className="flex items-center gap-2 rounded-[8px] border border-[#E5E5E5] bg-white px-4 py-2.5 text-[12px] text-[#bbb]">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        type="text"
        placeholder="Search countries"
        className="flex-1 bg-transparent outline-none text-[#111] placeholder:text-[#bbb]"
      />
    </div>
  );
}