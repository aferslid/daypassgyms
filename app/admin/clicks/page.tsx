import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { slugify } from "@/lib/slugify";
import AdminNav from "@/app/components/AdminNav";

type ClickStatsRow = {
  spot_id: number;
  name: string | null;
  city: string | null;
  country_full: string | null;
  total_clicks: number | string | null;
  google_maps_clicks: number | string | null;
  website_clicks: number | string | null;
  instagram_clicks: number | string | null;
  clicks_7d: number | string | null;
  clicks_30d: number | string | null;
  last_click_at: string | null;
  phone_clicks: number | string | null;
  unique_visitors: number | string | null;
};

type GlobalClickStatsRow = {
  total_clicks: number | string | null;
  unique_visitors: number | string | null;
};

function n(value: number | string | null | undefined) {
  return Number(value || 0);
}

export default async function AdminClicksPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_auth")?.value === "true";

  if (!isAdmin) {
    redirect("/admin");
  }

  const { data, error } = await supabaseAdmin
    .from("outbound_click_stats")
    .select("*")
    .order("total_clicks", { ascending: false });

  const { data: globalData, error: globalError } = await supabaseAdmin
    .from("outbound_click_global_stats")
    .select("*")
    .single();

    if (globalError) {
    throw new Error(
        `Could not load global click stats: ${globalError.message}`
    );
    }  

  if (error) {
    throw new Error(`Could not load click stats: ${error.message}`);
  }

  const stats = (data || []) as ClickStatsRow[];

  const globalStats = globalData as GlobalClickStatsRow;

  const uniqueVisitors = n(globalStats.unique_visitors);

  const totalClicks = stats.reduce(
    (sum, row) => sum + n(row.total_clicks),
    0
  );

  const clicks7d = stats.reduce(
    (sum, row) => sum + n(row.clicks_7d),
    0
  );

  const clicks30d = stats.reduce(
    (sum, row) => sum + n(row.clicks_30d),
    0
  );

  const googleMapsClicks = stats.reduce(
    (sum, row) => sum + n(row.google_maps_clicks),
    0
  );

  const websiteClicks = stats.reduce(
    (sum, row) => sum + n(row.website_clicks),
    0
  );

  const instagramClicks = stats.reduce(
    (sum, row) => sum + n(row.instagram_clicks),
    0
  );

  const phoneClicks = stats.reduce(
    (sum, row) => sum + n(row.phone_clicks),
    0
    );



  return (
    <main className="min-h-screen bg-[#F7F7F5] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7E9700]">
              DayPassGyms Admin
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Outbound clicks
            </h1>

            <p className="mt-2 text-sm text-[#777]">
              Track visits sent from DayPassGyms to gyms.
            </p>
          </div>

          <AdminNav />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
              Total clicks
            </p>
            <p className="mt-2 text-3xl font-black">
              {totalClicks.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
              Last 7 days
            </p>
            <p className="mt-2 text-3xl font-black">
              {clicks7d.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
              Last 30 days
            </p>
            <p className="mt-2 text-3xl font-black">
              {clicks30d.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
              Gyms clicked
            </p>
            <p className="mt-2 text-3xl font-black">
              {stats.length.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
                Unique visitors
            </p>
            <p className="mt-2 text-3xl font-black">
                {uniqueVisitors.toLocaleString()}
            </p>
            </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
              Google Maps
            </p>
            <p className="mt-2 text-2xl font-black">
              {googleMapsClicks.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
              Websites
            </p>
            <p className="mt-2 text-2xl font-black">
              {websiteClicks.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
              Instagram
            </p>
            <p className="mt-2 text-2xl font-black">
              {instagramClicks.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#999]">
                Phone
            </p>
            <p className="mt-2 text-2xl font-black">
                {phoneClicks.toLocaleString()}
            </p>
            </div>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-[#F2F2F0]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Gym</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Unique</th>
                <th className="px-4 py-3">Maps</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Instagram</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">7d</th>
                <th className="px-4 py-3">30d</th>
                <th className="px-4 py-3">Last click</th>
              </tr>
            </thead>

            <tbody>
              {stats.map((row, index) => (
                <tr
                  key={row.spot_id}
                  className="border-b last:border-b-0"
                >
                  <td className="px-4 py-3 text-[#999]">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3 font-bold">
                    <a
                    href={`/gym/${slugify(row.name || "gym")}-${row.spot_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    >
                    {row.name || `Gym ${row.spot_id}`}
                    </a>
                  </td>

                  <td className="px-4 py-3 text-[#666]">
                    {[row.city, row.country_full]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>

                  <td className="px-4 py-3 font-black">
                    {n(row.total_clicks)}
                  </td>

                  <td className="px-4 py-3">
                    {n(row.unique_visitors)}
                    </td>

                  <td className="px-4 py-3">
                    {n(row.google_maps_clicks)}
                  </td>

                  <td className="px-4 py-3">
                    {n(row.website_clicks)}
                  </td>

                  <td className="px-4 py-3">
                    {n(row.instagram_clicks)}
                  </td>

                  <td className="px-4 py-3">
                    {n(row.phone_clicks)}
                  </td>

                  <td className="px-4 py-3">
                    {n(row.clicks_7d)}
                  </td>

                  <td className="px-4 py-3">
                    {n(row.clicks_30d)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-[#777]">
                    {row.last_click_at
                      ? new Date(row.last_click_at).toLocaleString("en-GB")
                      : "—"}
                  </td>
                </tr>
              ))}

              {stats.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-[#999]"
                  >
                    No outbound clicks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}