"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import countriesList from "world-countries";
import { supabase } from "../../lib/supabase";

type CountryStats = {
  total: number;
  community: number;
  osm: number;
  official: number;
};

type CountryStatsRow = {
  country: string;
  total: number;
  community: number;
  osm: number;
  official: number;
};

type LeaderboardRow = {
  user_id: string;
  username: string;
  count: number;
};

const countryOptions = countriesList
  .map((country) => ({
    code: country.cca2,
    name: country.name.common,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

function getCountryName(code: string) {
  return countryOptions.find((c) => c.code === code)?.name || code;
}

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

export default function CommunityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [countryStats, setCountryStats] = useState<Record<string, CountryStats>>(
    {}
  );
  const [selectedCountry, setSelectedCountry] = useState("FR");

  useEffect(() => {
  const fetchCommunityData = async () => {
    try {
      setLoading(true);

      const { data: countryStatsData, error: countryStatsError } = await supabase
        .from("community_country_stats")
        .select("*");

      if (countryStatsError) {
        console.error("Error fetching country stats:", countryStatsError);
        return;
      }

      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("community_leaderboard")
        .select("*")
        .order("count", { ascending: false })
        .limit(100);

      if (leaderboardError) {
        console.error("Error fetching leaderboard:", leaderboardError);
        return;
      }

      const nextCountryStats: Record<string, CountryStats> = {};

      ((countryStatsData as CountryStatsRow[]) || []).forEach((row) => {
        nextCountryStats[row.country] = {
          total: row.total,
          community: row.community,
          osm: row.osm,
          official: row.official,
        };
      });

      setLeaderboard((leaderboardData as LeaderboardRow[]) || []);
      setCountryStats(nextCountryStats);

      if (!nextCountryStats[selectedCountry]) {
        const firstCountry = Object.keys(nextCountryStats)[0];
        if (firstCountry) setSelectedCountry(firstCountry);
      }
    } catch (error) {
      console.error("Unexpected error fetching community data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchCommunityData();
}, []);

  const selectedStats = useMemo(() => {
    return (
      countryStats[selectedCountry] || {
        total: 0,
        community: 0,
        osm: 0,
        official: 0,
      }
    );
  }, [countryStats, selectedCountry]);

  const rawCommunityPercentage =
  selectedStats.total > 0
    ? (selectedStats.community / selectedStats.total) * 100
    : 0;

  const communityPercentage =
  rawCommunityPercentage >= 1
    ? rawCommunityPercentage.toFixed(1)
    : rawCommunityPercentage.toFixed(4);

  const sortedCountries = useMemo(() => {
    return Object.keys(countryStats).sort((a, b) => {
      const aName = getCountryName(a);
      const bName = getCountryName(b);
      return aName.localeCompare(bName);
    });
  }, [countryStats]);

  const topCountries = useMemo(() => {
    return Object.entries(countryStats)
      .map(([code, stats]) => ({
        code,
        ...stats,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [countryStats]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => router.push("/profile")}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            ← Back to profile
          </button>

          <button
            onClick={() => router.push("/")}
            className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
          >
            Back to map
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black">Community</h1>
          <p className="text-gray-600 mt-1">
            Top contributors and country coverage
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            Loading community stats...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow p-5 border border-gray-200">
              <h2 className="text-xl font-bold mb-4">Top Contributors</h2>

              {leaderboard.length === 0 ? (
                <p className="text-gray-500">No contributions yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 text-sm font-semibold text-gray-500">
                          #{index + 1}
                        </div>
                        <div className="font-medium text-black truncate">
                          {user.username}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        {user.count} spot{user.count > 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-5 border border-gray-200">
              <h2 className="text-xl font-bold mb-4">Country Stats</h2>

              <div className="mb-4">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white"
                >
                  {sortedCountries.map((code) => (
                    <option key={code} value={code}>
                      {getCountryName(code)} ({code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-5 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="text-2xl font-bold mb-1">
                  {selectedCountry ? `${getFlagEmoji(selectedCountry)}`  : ""}
                  {getCountryName(selectedCountry)}
                </div>
                <div className="text-sm text-gray-600">
                  Community coverage breakdown
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <div className="text-sm text-gray-500">Total spots</div>
                  <div className="text-2xl font-bold">{selectedStats.total}</div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <div className="text-sm text-gray-500">Community</div>
                  <div className="text-2xl font-bold">{selectedStats.community}</div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <div className="text-sm text-gray-500">OSM</div>
                  <div className="text-2xl font-bold">{selectedStats.osm}</div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <div className="text-sm text-gray-500">Official</div>
                  <div className="text-2xl font-bold">{selectedStats.official}</div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <div className="text-sm text-gray-500">Community share</div>
                <div className="text-2xl font-bold">{communityPercentage}%</div>
                </div>

                <div className="mt-3">
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                    className="h-full bg-black rounded-full transition-all"
                    style={{
                        width: `${Math.max(rawCommunityPercentage, rawCommunityPercentage > 0 ? 0.5 : 0)}%`,
                    }}
                    />
                </div>
                </div>

              </div>

              <div>
                <h3 className="font-semibold mb-3">Top Countries</h3>
                <div className="space-y-2">
                  {topCountries.map((country, index) => (
                    <div
                      key={country.code}
                      className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedCountry(country.code)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 text-sm font-semibold text-gray-500">
                          #{index + 1}
                        </div>
                        <div className="font-medium">
                          {getFlagEmoji(country.code)} {getCountryName(country.code)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        {country.total} total
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}