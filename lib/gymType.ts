export function formatGymType(type: string | null) {
  if (!type) return "Gym";

  const normalized = type.trim().toLowerCase();

  const labels: Record<string, string> = {
    gym: "Gym",
    crossfit: "CrossFit",
    hyrox: "HYROX",
    functional: "Functional training",
    boxing: "Boxing",
    yoga: "Yoga",
    calisthenics: "Calisthenics",
    martial_arts: "Martial arts",
  };

  return (
    labels[normalized] ||
    type
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function getGymTypeBadgeClass(type: string | null) {
  const normalized = (type || "gym").trim().toLowerCase();

  const styles: Record<string, string> = {
    gym: "bg-[#EEF6C8] text-[#536600]",
    crossfit: "bg-[#FFE1DC] text-[#A52A1A]",
    hyrox: "bg-[#DCEBFF] text-[#1556A8]",
    functional: "bg-[#EDE3FF] text-[#6941A5]",
    boxing: "bg-[#FFE7C2] text-[#9A5200]",
    yoga: "bg-[#FFE2F1] text-[#9B2C64]",
    calisthenics: "bg-[#D9F7F2] text-[#0F766E]",
    martial_arts: "bg-[#F1E7D3] text-[#72521F]",
  };

  return styles[normalized] || styles.gym;
}