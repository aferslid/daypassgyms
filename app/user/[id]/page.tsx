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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isMutualFriend, setIsMutualFriend] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);

      if (user?.id && user.id !== userId) {
        const { data: existingFriend, error: existingFriendError } = await supabase
            .from("friends")
            .select("requester_id, addressee_id")
            .eq("requester_id", user.id)
            .eq("addressee_id", userId)
            .maybeSingle();

        if (existingFriendError) {
            console.error("Error checking sent friend request:", existingFriendError);
        }

        const { data: reverseFriend, error: reverseFriendError } = await supabase
            .from("friends")
            .select("requester_id, addressee_id")
            .eq("requester_id", userId)
            .eq("addressee_id", user.id)
            .maybeSingle();

        if (reverseFriendError) {
            console.error("Error checking reverse friend request:", reverseFriendError);
        }

        setIsFriend(!!existingFriend);
        setIsMutualFriend(!!existingFriend && !!reverseFriend);
      }

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
    return <div className="p-4 max-w-lg mx-auto w-full text-black">Loading profile...</div>;
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

  const handleAddFriend = async () => {
    if (!currentUserId || !profile?.id) return;

    setIsAddingFriend(true);

    const { error } = await supabase
        .from("friends")
        .insert({
        requester_id: currentUserId,
        addressee_id: profile.id,
        });

    setIsAddingFriend(false);

    if (error) {
        console.error("Add friend error:", error);
        alert(error.message);
        return;
    }

    setIsFriend(true);
    setIsMutualFriend(false);
    alert("Friend added");
    };

  const handleRemoveFriend = async () => {
    if (!currentUserId || !profile?.id) return;

    const { error } = await supabase
        .from("friends")
        .delete()
        .eq("requester_id", currentUserId)
        .eq("addressee_id", profile.id);

    if (error) {
        console.error("Remove friend error:", error);
        alert(error.message);
        return;
    }

    setIsFriend(false);
    setIsMutualFriend(false);
    };


  return (
    <div className="p-4 max-w-lg mx-auto w-full">
      <button
        onClick={() => router.push("/")}
        className="mb-4 bg-black text-white px-4 py-2 rounded-xl"
      >
        ← Back to map
      </button>

      <h1 className="text-2xl font-bold mb-4 text-black">Traveler profile</h1>

      <div className="bg-white text-black rounded-2xl shadow p-4 space-y-4 border border-gray-2000">
        <p className="text-black">
          <strong>Username:</strong> {profile.username}
        </p>

        <p className="text-black">
          <strong>Contributions:</strong> {contributions}
        </p>

        {profile.bio && (
          <p className="text-gray-700">
            {profile.bio}
          </p>
        )}

         {currentUserId !== profile.id && (
            <>
                <div className="flex gap-2 mt-4 justify-center">
                <button
                    onClick={isFriend ? handleRemoveFriend : handleAddFriend}
                    disabled={isAddingFriend}
                    className={`px-4 py-2 rounded-xl text-white ${
                    isFriend ? "bg-red-500" : "bg-black"
                    } disabled:opacity-50`}
                >
                    {isFriend ? "Remove friend" : isAddingFriend ? "Adding..." : "Add friend"}
                </button>

                <button
                    disabled={!isMutualFriend}
                    className={`px-4 py-2 rounded-xl border ${
                    isMutualFriend
                        ? "bg-white text-black border-gray-300"
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                >
                    Message
                </button>
                </div>

                {!isMutualFriend && (
                <p className="text-xs text-gray-500 text-center mt-2">
                    Messaging is available only when both users added each other.
                </p>
                )}
            </>
            )}
    

        <div>
          <p className="font-medium mb-2 text-black">Countries visited</p>
          <p className="text-sm text-gray-600 mb-2">
            {countries.length} countries visited
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            {countries.map((code: string) => {
              const country = countryOptions.find((c) => c.code === code);

              return (
                <div
                  key={code}
                  className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-sm text-black"
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