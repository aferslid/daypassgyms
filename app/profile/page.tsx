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

function getFlagEmoji(countryCode: string) {
  try {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  } catch {
    return countryCode;
  }
}

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
  const [hasSearched, setHasSearched] = useState(false);

  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [showFriends, setShowFriends] = useState(false);
  const [showReceived, setShowReceived] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const ADMIN_EMAIL = "a.fers-lidou@outlook.fr";
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserEmail(user?.email ?? null);
    setIsUserLoaded(true);

    if (!user) {
        setLoading(false);
        return;
    }

    setUser(user);

    const [{ data: profile }, { data: contributionRow }] = await Promise.all([
        supabase
        .from("profiles")
        .select("username, bio, countries")
        .eq("id", user.id)
        .single(),

        supabase
        .from("user_contributions")
        .select("count")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (profile) {
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setCountries(
        profile.countries
            ? profile.countries
                .split(",")
                .map((c: string) => c.trim())
                .filter(Boolean)
            : []
        );
    }

    setContributions(contributionRow?.count || 0);
    setLoading(false);
    };

        fetchUser();
    }, []);

  useEffect(() => {
  if (!user) return;
  loadFriendData();
  }, [user]);

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
        setHasSearched(true);

        if (!trimmed) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, bio")
            .ilike("username", `${trimmed}%`)
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
        loadFriendData();
    };

    const loadFriendData = async () => {
        if (!user) return;

        const { data: sentData, error: sentError } = await supabase
            .from("friends")
            .select("requester_id, addressee_id")
            .eq("requester_id", user.id);

        if (sentError) {
            console.error("Error loading sent requests:", sentError);
            return;
        }

        const { data: receivedData, error: receivedError } = await supabase
            .from("friends")
            .select("requester_id, addressee_id")
            .eq("addressee_id", user.id);

        if (receivedError) {
            console.error("Error loading received requests:", receivedError);
            return;
        }

        const sent = sentData || [];
        const received = receivedData || [];

        const sentIds = new Set(sent.map((row) => row.addressee_id));
        const receivedIds = new Set(received.map((row) => row.requester_id));

        const mutualIds = [...sentIds].filter((id) => receivedIds.has(id));
        const receivedOnlyIds = [...receivedIds].filter((id) => !sentIds.has(id));
        const sentOnlyIds = [...sentIds].filter((id) => !receivedIds.has(id));

        const allIds = [...new Set([...mutualIds, ...receivedOnlyIds, ...sentOnlyIds])];

        if (allIds.length === 0) {
            setFriendsList([]);
            setReceivedRequests([]);
            setSentRequests([]);
            return;
        }

        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, bio")
            .in("id", allIds);

        if (profilesError) {
            console.error("Error loading related profiles:", profilesError);
            return;
        }

        const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

        setFriendsList(mutualIds.map((id) => profilesMap.get(id)).filter(Boolean));
        setReceivedRequests(
            receivedOnlyIds.map((id) => profilesMap.get(id)).filter(Boolean)
        );
        setSentRequests(sentOnlyIds.map((id) => profilesMap.get(id)).filter(Boolean));
    };

    const handleAddBack = async (targetUserId: string) => {
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
            console.error("Add back error:", error);
            alert(error.message);
            return;
        }

        alert("Friend added");
        loadFriendData();
    };

    if (loading) {
        return (
            <div className="p-4 max-w-lg mx-auto w-full">
            <button
                onClick={() => router.push("/")}
                className="mb-4 bg-black text-white px-4 py-2 rounded-xl"
            >
                ← Back to map
            </button>

            <div className="bg-white text-black rounded-2xl shadow p-4 border border-gray-200">
                Loading profile...
            </div>
            </div>
        );
    }

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

        if (!isUserLoaded) {
        return <div className="p-4">Loading...</div>;
        }

  return (
    <div className="p-4 max-w-lg mx-auto w-full bg-gray-50 min-h-screen">
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <button
            onClick={() => router.push("/")}
            className="bg-black text-white px-4 py-2 rounded-xl"
        >
            ← Back to map
        </button>

        {isUserLoaded && currentUserEmail === ADMIN_EMAIL && (
            <button
            onClick={() => router.push("/admin/reports")}
            className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
            >
            Admin reports
            </button>
        )}

        <button
        onClick={() => router.push("/community")}
        className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
        >
        Community
        </button>
        </div>

        <div className="mb-2">
        <h1 className="text-2xl font-bold text-black">My Profile</h1>
        <p className="text-sm text-gray-500">
            Manage your traveler identity
        </p>
        </div>

        <div className="text-sm space-y-1 mb-2">
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
            <label className="text-sm text-black-500 mt-5 block font-medium mb-1">Username</label>
            <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 text-black placeholder-gray-400"
            />
        </div>

        <div>
            <label className="text-sm text-black-500 mt-4 block font-medium mb-1">Bio</label>
            <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-white rounded-xl px-4 py-3 min-h-[140px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10 text-black placeholder-gray-400"
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
                className={`border rounded-xl px-3 py-2 bg-gray-50 text-sm cursor-pointer hover:bg-gray-100 ${
                activeCountry === code ? "border-black bg-gray-100" : "border-gray-300"
                }`}
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

        <div className="mt-6 pt-4 border-t border-black-200">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">Find travelers</h2>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
            type="text"
            placeholder="Search by username"
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setHasSearched(false);
            }}
            className="w-full sm:flex-1 border rounded-xl px-4 py-3 text-black placeholder-gray-400"
            />

            <button
            type="button"
            onClick={handleSearchUsers}
            className="bg-black text-white px-4 py-3 rounded-xl hover:opacity-90 transition w-full sm:w-auto"
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

        {!isSearching && hasSearched && searchResults.length === 0 && (
            <p className="text-sm text-gray-500">No users found.</p>
        )}
        </div>

        <div className="border-t pt-4 space-y-3">
        <h2 className="text-lg font-semibold">Connections</h2>

        <div className="border border-gray-200 rounded-xl p-4 bg-grayz-50 overflow-hidden">
            <button
            type="button"
            onClick={() => setShowFriends((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left"
            >
            <span className="font-medium">Friends ({friendsList.length})</span>
            <span>{showFriends ? "−" : "+"}</span>
            </button>

            {showFriends && (
            <div className="p-3 space-y-3">
                {friendsList.length === 0 ? (
                <p className="text-sm text-gray-500">No friends yet.</p>
                ) : (
                friendsList.map((friend) => (
                    <div
                    key={friend.id}
                    className="border rounded-xl p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                    <div>
                        <p className="font-semibold text-black">
                        {friend.username || "Unnamed user"}
                        </p>
                        {friend.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {friend.bio}
                        </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                        type="button"
                        onClick={() => router.push(`/user/${friend.id}`)}
                        className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
                        >
                        View profile
                        </button>

                        <button
                        type="button"
                        onClick={() => router.push(`/messages/${friend.id}`)}
                        className="bg-black text-white px-4 py-2 rounded-xl"
                        >
                        Message
                        </button>
                    </div>
                    </div>
                ))
                )}
            </div>
            )}
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-grayz-50 overflow-hidden">
            <button
            type="button"
            onClick={() => setShowReceived((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left"
            >
            <span className="font-medium">
                Requests received ({receivedRequests.length})
            </span>
            <span>{showReceived ? "−" : "+"}</span>
            </button>

            {showReceived && (
            <div className="p-3 space-y-3">
                {receivedRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No received requests.</p>
                ) : (
                receivedRequests.map((person) => (
                    <div
                    key={person.id}
                    className="border rounded-xl p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                    <div>
                        <p className="font-semibold text-black">
                        {person.username || "Unnamed user"}
                        </p>
                        {person.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {person.bio}
                        </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                        type="button"
                        onClick={() => router.push(`/user/${person.id}`)}
                        className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
                        >
                        View profile
                        </button>

                        <button
                        type="button"
                        onClick={() => handleAddBack(person.id)}
                        disabled={addingFriendId === person.id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                        >
                        {addingFriendId === person.id ? "Adding..." : "Add back"}
                        </button>
                    </div>
                    </div>
                ))
                )}
            </div>
            )}
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-grayz-50 overflow-hidden">
            <button
            type="button"
            onClick={() => setShowSent((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left"
            >
            <span className="font-medium">Requests sent ({sentRequests.length})</span>
            <span>{showSent ? "−" : "+"}</span>
            </button>

            {showSent && (
            <div className="p-3 space-y-3">
                {sentRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No sent requests.</p>
                ) : (
                sentRequests.map((person) => (
                    <div
                    key={person.id}
                    className="border rounded-xl p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                    <div>
                        <p className="font-semibold text-black">
                        {person.username || "Unnamed user"}
                        </p>
                        {person.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {person.bio}
                        </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                        type="button"
                        onClick={() => router.push(`/user/${person.id}`)}
                        className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
                        >
                        View profile
                        </button>

                        <button
                        type="button"
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl"
                        disabled
                        >
                        Pending
                        </button>
                    </div>
                    </div>
                ))
                )}
            </div>
            )}
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