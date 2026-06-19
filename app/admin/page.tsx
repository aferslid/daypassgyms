import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") || "");

  if (password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();

  cookieStore.set("admin_auth", "true", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24,
  });

  redirect("/admin/suggestions");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#F7F7F5] p-10">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-8">
        <h1 className="text-3xl font-black">Admin login</h1>

        {error && (
          <p className="mt-4 text-sm font-bold text-red-600">
            Wrong password.
          </p>
        )}

        <form action={login} className="mt-6 space-y-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full rounded-xl border px-4 py-3"
          />

          <button className="rounded-lg bg-black px-4 py-3 text-sm font-bold text-white">
            Login
          </button>
        </form>
      </div>
    </main>
  );
}