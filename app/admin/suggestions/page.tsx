import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminNav from "@/app/components/AdminNav";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

async function deleteSuggestion(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_auth")?.value === "true";

    if (!isAdmin) {
    throw new Error("Unauthorized");
    }

  const id = Number(formData.get("id"));

  const supabase = getAdminClient();

  await supabase.from("gym_suggestions").delete().eq("id", id);

  revalidatePath("/admin/suggestions");
}

async function approveSuggestion(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
const isAdmin = cookieStore.get("admin_auth")?.value === "true";

if (!isAdmin) {
  throw new Error("Unauthorized");
}

  const id = Number(formData.get("id"));

  const supabase = getAdminClient();

  const { data: s } = await supabase
    .from("gym_suggestions")
    .select("*")
    .eq("id", id)
    .single();

  if (!s) return;

  await supabase
  .from("gym_suggestions")
  .update({ status: "approved" })
  .eq("id", id);

  revalidatePath("/admin/suggestions");
}

export default async function AdminSuggestionsPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_auth")?.value === "true";

  if (!isAdmin) {
    redirect("/admin");
  }

  const supabase = getAdminClient();

  const { data: suggestions } = await supabase
    .from("gym_suggestions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
  <main className="min-h-screen bg-[#F7F7F5] p-10">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7E9700]">
          DayPassGyms Admin
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Gym suggestions
        </h1>
      </div>

      <AdminNav />
    </div>

      <div className="mt-8 space-y-4">
        {(suggestions || []).map((s) => {
          const submissionLabel =
            s.submission_type === "owner"
              ? "Owner / manager"
              : s.submission_type === "update"
              ? "Update"
              : "New gym";

          return (
            <div
              key={s.id}
              className="rounded-2xl border border-[#E4E4E1] bg-white p-6"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">
                      {s.gym_name}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        s.submission_type === "owner"
                          ? "bg-[#EEF6C8] text-[#536600]"
                          : s.submission_type === "update"
                          ? "bg-[#DCEBFF] text-[#1556A8]"
                          : "bg-[#F1F1F1] text-[#555]"
                      }`}
                    >
                      {submissionLabel}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#777]">
                    {s.city || "No city"} — {s.country || "No country"}
                  </p>

                  {s.spot_id && (
                    <p className="mt-1 text-xs font-bold text-[#999]">
                      Existing gym ID: {s.spot_id}
                    </p>
                  )}
                </div>

                <span className="text-xs font-bold uppercase text-[#999]">
                  {s.status || "new"}
                </span>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999]">
                    Location & contact
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    {s.gym_type && <p>Type: {s.gym_type}</p>}
                    {s.address && <p>Address: {s.address}</p>}
                    {s.phone && <p>Phone: {s.phone}</p>}
                    {s.gym_email && <p>Gym email: {s.gym_email}</p>}

                    {s.website_url && (
                      <p>
                        Website:{" "}
                        <a
                          href={s.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold underline"
                        >
                          Open
                        </a>
                      </p>
                    )}

                    {s.instagram_url && (
                      <p>
                        Instagram:{" "}
                        <a
                          href={s.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold underline"
                        >
                          Open
                        </a>
                      </p>
                    )}

                    {s.google_maps_url && (
                      <p>
                        Google Maps:{" "}
                        <a
                          href={s.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold underline"
                        >
                          Open
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999]">
                    Passes & pricing
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    {s.day_pass_price && (
                      <p>
                        Day pass: {s.day_pass_price}
                        {s.currency ? ` ${s.currency}` : ""}
                      </p>
                    )}

                    {s.week_pass_price && (
                      <p>
                        Week pass: {s.week_pass_price}
                        {s.currency ? ` ${s.currency}` : ""}
                      </p>
                    )}

                    {s.day_pass_note && (
                      <p>Pass note: {s.day_pass_note}</p>
                    )}

                    {s.free_trial !== null &&
                      s.free_trial !== undefined && (
                        <p>
                          Free trial: {s.free_trial ? "Yes" : "No"}
                        </p>
                      )}

                    {s.free_trial_duration && (
                      <p>
                        Free trial duration: {s.free_trial_duration}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999]">
                    Facilities
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    {s.shower && <p>Shower: {s.shower}</p>}
                    {s.locker && <p>Locker: {s.locker}</p>}
                    {s.wifi && <p>Wi-Fi: {s.wifi}</p>}
                    {s.pool && <p>Pool: {s.pool}</p>}
                    {s.access_gender && (
                      <p>Access: {s.access_gender}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999]">
                    Additional information
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    {s.opening_hours && (
                      <div>
                        <p className="font-bold">Opening hours:</p>
                        <p className="whitespace-pre-line text-[#666]">
                          {s.opening_hours}
                        </p>
                      </div>
                    )}

                    {s.notes && (
                      <div>
                        <p className="font-bold">Notes:</p>
                        <p className="whitespace-pre-line text-[#666]">
                          {s.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {s.contact_email && (
                <div className="mt-6 rounded-xl bg-[#F7F7F5] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999]">
                    Submitter
                  </p>

                  <p className="mt-1 text-sm">
                    {s.contact_email}
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <form action={approveSuggestion}>
                  <input type="hidden" name="id" value={s.id} />

                  <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white">
                    Mark reviewed
                  </button>
                </form>

                <form action={deleteSuggestion}>
                  <input type="hidden" name="id" value={s.id} />

                  <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}