"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import countriesList from "world-countries";

const countryOptions = countriesList
  .map((country) => ({
    code: country.cca2,
    name: country.name.common,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
        setLoading(false);
        return;
        }

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
      setLoading(false);
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

        if (error.message.includes("unique")) {
            alert("Username already taken");
        } else {
            alert(error.message);
        }

        return;
        }

        console.log("Profile saved:", data);
        alert("Profile saved");
    };

    const handleSearchUsers = async () => {
        const trimmed = searchTerm.trim();

        if (!trimmed) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, bio")
            .ilike("username", `%${trimmed}%`)
            .limit(20);

        setIsSearching(false);

        if (error) {
            console.error("Error searching users:", error);
            alert(error.message);
            return;
        }

        setSearchResults((data || []).filter((profile) => profile.id !== user?.id));
    };

    const handleAddFriend = async (targetUserId: string) => {
        if (!user) return;

        setAddingFriendId(targetUserId);

        const { error } = await supabase
            .from("friends")
            .insert({
            requester_id: user.id,
            addressee_id: targetUserId,
            });

        setAddingFriendId(null);

        if (error) {
            console.error("Add friend error:", error);
            alert(error.message);
            return;
        }

        alert("Friend added");
    };

    if (!user && !loading) {
        return (
            <div className="p-4 max-w-lg mx-auto w-full">
            <button
                onClick={() => router.push("/")}
                className="mb-4 bg-black text-white px-4 py-2 rounded-xl"
            >
                ← Back to map
            </button>

            <div className="bg-white rounded-2xl shadow p-6 text-center">
                <h1 className="text-xl font-bold mb-2">
                Create an account
                </h1>

                <p className="text-gray-600 mb-4">
                You need an account to access your profile.
                </p>

                <button
                onClick={() => router.push("/")}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                Back to map
                </button>
            </div>
            </div>
        );
        }

  return (
    <div className="p-4 max-w-lg mx-auto w-full">
        <button
        onClick={() => router.push("/")}
        className="mb-4 bg-black text-white px-4 py-2 rounded-xl"
        >
        ← Back to map
        </button>

        <h1 className="text-2xl font-bold mb-4">Profile</h1>

        <div className="bg-white text-black rounded-2xl shadow p-4 space-y-4 border border-gray-200">
        <p>
            <strong>Email:</strong> {user?.email}
        </p>

        <p>
            <strong>Contributions:</strong> {contributions}
        </p>

        {bio && (
        <p className="text-gray-600 mt-2">
            {bio}
        </p>
        )}

        <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-black placeholder-gray-400"
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 min-h-[100px] text-black placeholder-gray-400"
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Countries visited</label>

            <p className="text-sm text-gray-500 mb-2">
            Visited countries: {countries.length}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mb-3 w-full">
            <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full sm:flex-1 border rounded-xl px-4 py-3 min-w-0 text-black"
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
                className="bg-blue-600 text-white px-4 py-3 rounded-xl w-full sm:w-auto"
            >
                Add
            </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
            {countries.map((code) => {
                const country = countryOptions.find((c) => c.code === code);

                return (
                <div
                key={code}
                onClick={() =>
                setActiveCountry((prev) => (prev === code ? null : code))
                }
                className="border rounded-xl px-3 py-2 bg-gray-50 text-sm cursor-pointer"
                title={country?.name}
                >
                {getFlagEmoji(code)}
                </div>
                );
            })}
            </div>

            {activeCountry && (
                <div className="mt-3 p-3 border rounded-xl bg-gray-50">
                    <p className="text-sm mb-2">
                    Selected country:{" "}
                    <strong>
                        {countryOptions.find((c) => c.code === activeCountry)?.name}
                    </strong>
                    </p>

                    <button
                    type="button"
                    onClick={() => {
                        setCountries((prev) => prev.filter((c) => c !== activeCountry));
                        setActiveCountry(null);
                    }}
                    className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm"
                    >
                    Remove country
                    </button>
                </div>
                )}

        </div>

        <div className="border-t pt-4">
        <h2 className="text-lg font-semibold mb-3">Find travelers</h2>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
            type="text"
            placeholder="Search by username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-1 border rounded-xl px-4 py-3 text-black placeholder-gray-400"
            />

            <button
            type="button"
            onClick={handleSearchUsers}
            className="bg-black text-white px-4 py-3 rounded-xl w-full sm:w-auto"
            >
            {isSearching ? "Searching..." : "Search"}
            </button>
        </div>

        {searchResults.length > 0 && (
            <div className="space-y-3">
            {searchResults.map((result) => (
                <div
                key={result.id}
                className="border rounded-xl p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                <div>
                    <p className="font-semibold text-black">
                    {result.username || "Unnamed user"}
                    </p>

                    {result.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {result.bio}
                    </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                    type="button"
                    onClick={() => router.push(`/user/${result.id}`)}
                    className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
                    >
                    View profile
                    </button>

                    <button
                    type="button"
                    onClick={() => handleAddFriend(result.id)}
                    disabled={addingFriendId === result.id}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                    >
                    {addingFriendId === result.id ? "Adding..." : "Add friend"}
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}

        {!isSearching && searchTerm.trim() && searchResults.length === 0 && (
            <p className="text-sm text-gray-500">No users found.</p>
        )}
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