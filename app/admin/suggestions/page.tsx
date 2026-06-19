import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function deleteSuggestion(formData: FormData) {
  "use server";

  const key = String(formData.get("admin_key") || "");
  const id = Number(formData.get("id"));

  if (key !== process.env.ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }

  const supabase = getAdminClient();

  await supabase.from("gym_suggestions").delete().eq("id", id);

  revalidatePath("/admin/suggestions");
}

async function approveSuggestion(formData: FormData) {
  "use server";

  const key = String(formData.get("admin_key") || "");
  const id = Number(formData.get("id"));

  if (key !== process.env.ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }

  const supabase = getAdminClient();

  const { data: s } = await supabase
    .from("gym_suggestions")
    .select("*")
    .eq("id", id)
    .single();

  if (!s) return;

  await supabase.from("spots").insert({
    name: s.gym_name,
    city: s.city,
    country: s.country,
    type: "gym",
    google_maps_url: s.google_maps_url,
    website_url: s.website_url,
    details: {
      day_pass_price: s.day_pass_price,
      shower:
        s.shower === "yes"
          ? true
          : s.shower === "no"
          ? false
          : null,
    },
  });

  await supabase.from("gym_suggestions").delete().eq("id", id);

  revalidatePath("/admin/suggestions");
}

export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  if (key !== process.env.ADMIN_PASSWORD) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] p-10">
        <h1 className="text-3xl font-black">Admin locked</h1>
      </main>
    );
  }

  const supabase = getAdminClient();

  const { data: suggestions } = await supabase
    .from("gym_suggestions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#F7F7F5] p-10">
      <h1 className="text-4xl font-black">Gym suggestions</h1>

      <div className="mt-8 space-y-4">
        {(suggestions || []).map((s) => (
          <div key={s.id} className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-black">{s.gym_name}</h2>
            <p className="mt-1 text-sm text-[#777]">
              {s.city || "No city"} — {s.country || "No country"}
            </p>

            {s.website_url && <p className="mt-3">Website: {s.website_url}</p>}
            {s.google_maps_url && <p>Maps: {s.google_maps_url}</p>}
            {s.day_pass_price && <p>Price: {s.day_pass_price}</p>}
            {s.shower && <p>Shower: {s.shower}</p>}
            {s.notes && <p className="mt-3">{s.notes}</p>}
            {s.contact_email && <p className="mt-3">Email: {s.contact_email}</p>}

            <div className="mt-5 flex gap-3">
            <form action={approveSuggestion}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="admin_key" value={key} />
                <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white">
                Approve
                </button>
            </form>

            <form action={deleteSuggestion}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="admin_key" value={key} />
                <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">
                Delete
                </button>
            </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}