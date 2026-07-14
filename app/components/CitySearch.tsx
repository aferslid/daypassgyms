"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function CitySearch({ value, onChange }: Props) {
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search cities"
        className="flex-1 bg-transparent text-[#111] outline-none placeholder:text-[#bbb]"
      />
    </div>
  );
}