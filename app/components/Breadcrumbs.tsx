import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  light?: boolean;
};

export default function Breadcrumbs({
  items,
  light = false,
}: BreadcrumbsProps) {
  const baseUrl = "https://www.daypassgyms.com";

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px]">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li
                key={`${item.href}-${index}`}
                className="flex items-center gap-2"
              >
                {isLast ? (
                  <span
                    aria-current="page"
                    className={light ? "text-white" : "text-[#111]"}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={
                      light
                        ? "text-[#777] transition hover:text-white"
                        : "text-[#777] transition hover:text-[#111]"
                    }
                  >
                    {item.label}
                  </Link>
                )}

                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={light ? "text-[#444]" : "text-[#AAA]"}
                  >
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}