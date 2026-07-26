import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import { blogPosts } from "./posts";

export const metadata: Metadata = {
  title: "Travel Fitness Blog | DayPassGyms",
  description:
    "Practical guides about gym day passes, training while traveling, gym etiquette and visitor access around the world.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#F2F2F0] font-[family-name:var(--font-space)] text-[#111]">
      <section className="relative overflow-hidden bg-[#0C0C0C] text-white">
        <div className="relative mx-auto max-w-7xl px-6 py-5">
            <Header />

            <div className="pb-20 pt-16 md:pb-28 md:pt-24">
                <Link
                href="/"
                className="text-sm text-[#888] transition hover:text-white"
                >
                ← Back to home
                </Link>

            <div className="mt-14 text-[12px] font-bold uppercase tracking-[0.14em] text-[#C8F135]">
              Travel fitness guides
            </div>

            <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-[-3px] md:text-7xl">
              Train smarter,
              <br />
              wherever you travel.
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-[#999] md:text-lg">
              Practical information about gym day passes, visitor access,
              staffed hours, local rules and training abroad.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="inline-flex rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Latest articles
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-[-1.5px] md:text-4xl">
              Travel fitness resources
            </h2>
          </div>

          <div className="hidden text-sm text-[#777] md:block">
            {blogPosts.length}{" "}
            {blogPosts.length === 1 ? "article" : "articles"}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex min-h-[360px] flex-col rounded-[20px] border border-[#DADAD5] bg-white p-7 transition hover:-translate-y-1 hover:border-[#BFC0B8]"
            >
              <p className="w-fit rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
                {post.category}
                </p>

              <h2 className="mt-5 text-3xl font-extrabold leading-[1.02] tracking-[-1.3px]">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>

              <p className="mt-5 text-[15px] leading-7 text-[#666]">
                {post.excerpt}
              </p>

              <div className="mt-auto pt-8">
                <div className="flex items-center justify-between border-t border-[#E6E6E1] pt-5">
                  <div className="text-xs text-[#888]">
                    {post.readingTime}
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-bold transition group-hover:text-[#789000]"
                  >
                    Read article →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}