import Link from "next/link";
import { blogPosts } from "@/app/blog/posts";

type TravelGuidesProps = {
  title?: string;
  description?: string;
  limit?: number;
};

export default function TravelGuides({
  title = "Travel fitness guides",
  description = "Practical advice for finding gyms, using day passes and training while traveling.",
  limit = 3,
}: TravelGuidesProps) {
  const guides = [...blogPosts]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    )
    .slice(0, limit);

  if (guides.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="rounded-[24px] border border-[#E8E8E3] bg-white p-8 md:p-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#789000]">
          Travel fitness guides
        </p>

        <h2 className="mt-3 text-3xl font-extrabold tracking-[-1px] text-[#111]">
          {title}
        </h2>

        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#666]">
          {description}
        </p>

        <div
          className="mt-8 grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/blog/${guide.slug}`}
              className="group rounded-[16px] border border-[#E8E8E3] bg-[#FAFAF8] p-6 transition hover:-translate-y-0.5 hover:border-[#C8F135]"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#789000]">
                {guide.category}
              </div>

              <h3 className="mt-3 text-xl font-extrabold leading-tight tracking-[-0.5px] text-[#111]">
                {guide.title}
              </h3>

              <p className="mt-4 text-[14px] leading-7 text-[#666]">
                {guide.excerpt}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-[#E8E8E3] pt-4">
                <span className="text-xs text-[#888]">
                  {guide.readingTime}
                </span>

                <span className="text-sm font-bold text-[#111] transition group-hover:text-[#789000]">
                  Read guide →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/blog"
          className="mt-7 inline-flex text-sm font-bold text-[#111] transition hover:text-[#789000]"
        >
          View all travel fitness guides →
        </Link>
      </div>
    </section>
  );
}