"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import countriesList from "world-countries";

const countryOptions = countriesList
  .map((country) => ({
    code: country.cca2,
    name: country.name.common,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const getFlagEmoji = (code: string) => {
  const countryCode = code.trim().toUpperCase();
  if (countryCode.length !== 2) return countryCode;

  const first = countryCode.charCodeAt(0) + 127397;
  const second = countryCode.charCodeAt(1) + 127397;

  return String.fromCodePoint(first) + String.fromCodePoint(second);
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [contributions, setContributions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, bio, countries")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Erreur profil public:", profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { count } = await supabase
        .from("spots")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      setContributions(count || 0);
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return <div className="p-4 max-w-lg mx-auto w-full">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="p-4 max-w-lg mx-auto w-full">
        <button
          onClick={() => router.push("/")}
          className="mb-4 bg-black text-white px-4 py-2 rounded-xl"
        >
          ← Back to map
        </button>

        <p>Profile not found.</p>
      </div>
    );
  }

  const countries = profile.countries
    ? profile.countries.split(",").map((c: string) => c.trim()).filter(Boolean)
    : [];

  return (
    <div className="p-4 max-w-lg mx-auto w-full">
      <button
        onClick={() => router.push("/")}
        className="mb-4 bg-black text-white px-4 py-2 rounded-xl"
      >
        ← Back to map
      </button>

      <h1 className="text-2xl font-bold mb-4">Traveler profile</h1>

      <div className="bg-white rounded-2xl shadow p-4 space-y-4">
        <p>
          <strong>Username:</strong> {profile.username}
        </p>

        <p>
          <strong>Contributions:</strong> {contributions}
        </p>

        {profile.bio && (
          <p className="text-gray-600">
            {profile.bio}
          </p>
        )}

        <div>
          <p className="font-medium mb-2">Countries visited</p>
          <p className="text-sm text-gray-500 mb-2">
            {countries.length} countries visited
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            {countries.map((code: string) => {
              const country = countryOptions.find((c) => c.code === code);

              return (
                <div
                  key={code}
                  className="border rounded-xl px-3 py-2 bg-gray-50 text-sm"
                >
                  {getFlagEmoji(code)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}