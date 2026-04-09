"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const countryOptions = [
  { code: "FR", name: "France" },
  { code: "GE", name: "Georgia" },
  { code: "AL", name: "Albania" },
  { code: "ZM", name: "Zambia" },
  { code: "NA", name: "Namibia" },
  { code: "CA", name: "Canada" },
  { code: "HN", name: "Honduras" },
];

const getFlagEmoji = (code: string) => {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [contributions, setContributions] = useState(0);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, bio, countries")
        .eq("id", user.id)
        .single();

        if (profile) {
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setCountries(
            profile.countries
            ? profile.countries.split(",").map((c: string) => c.trim()).filter(Boolean)
            : []
        );
      }

      const { count } = await supabase
        .from("spots")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setContributions(count || 0);
    };

    fetchUser();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
        .from("profiles")
        .upsert(
        {
            id: user.id,
            username,
            bio,
            countries: countries.join(","),
        },
        { onConflict: "id" }
        )
        .select();

    if (error) {
        console.error("Erreur sauvegarde profil:", error);
        alert("Error while saving profile");
        return;
    }

    console.log("Profile saved:", data);
    alert("Profile saved");
    };

  return (
    <div className="p-6 max-w-xl mx-auto">
        <button
        onClick={() => router.push("/")}
        className="mb-4 bg-black text-white px-4 py-2 rounded-xl"
        >
        ← Back to map
        </button>

        <h1 className="text-2xl font-bold mb-4">Profile</h1>

        <div className="bg-white rounded-2xl shadow p-4 space-y-4">
        <p>
            <strong>Email:</strong> {user?.email}
        </p>

        <p>
            <strong>Contributions:</strong> {contributions}
        </p>

        <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 min-h-[100px]"
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Countries visited</label>

            <div className="flex gap-2 mb-3">
            <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="flex-1 border rounded-xl px-4 py-3"
            >
                <option value="">Select a country</option>
                {countryOptions.map((country) => (
                <option key={country.code} value={country.code}>
                    {country.name}
                </option>
                ))}
            </select>

            <button
                type="button"
                onClick={() => {
                if (!selectedCountry) return;
                if (countries.includes(selectedCountry)) return;
                setCountries((prev) => [...prev, selectedCountry]);
                setSelectedCountry("");
                }}
                className="bg-blue-600 text-white px-4 py-3 rounded-xl"
            >
                Add
            </button>
            </div>

            <div className="flex flex-wrap gap-2">
            {countries.map((code) => {
                const country = countryOptions.find((c) => c.code === code);

                return (
                <button
                    key={code}
                    type="button"
                    onClick={() =>
                    setCountries((prev) => prev.filter((c) => c !== code))
                    }
                    className="border rounded-xl px-3 py-2 bg-gray-50"
                    title={country?.name || code}
                >
                    {getFlagEmoji(code)} {country?.name}
                </button>
                );
            })}
            </div>
        </div>

        <button
            onClick={handleSaveProfile}
            className="w-full bg-green-600 text-white rounded-xl px-4 py-3"
        >
            Save profile
        </button>
        </div>
    </div>
  );
}