"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "a.fers-lidou@outlook.fr";

type SpotReport = {
  id: number;
  spot_id: number;
  user_id: string;
  reason: string;
  comment: string | null;
  created_at: string;
};

type Spot = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  description?: string | null;
  source?: string | null;
  user_id?: string | null;
  community_owned?: boolean | null;
};

type Profile = {
  id: string;
  username: string | null;
};

export default function AdminReportsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const [reports, setReports] = useState<SpotReport[]>([]);
  const [spotsMap, setSpotsMap] = useState<Record<number, Spot>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  const [deletingSpotId, setDeletingSpotId] = useState<number | null>(null);
  const [ignoringReportId, setIgnoringReportId] = useState<number | null>(null);

  const [improvements, setImprovements] = useState<any[]>([]);
  const [loadingImprovements, setLoadingImprovements] = useState(false);

  const fetchImprovements = async () => {
    try {
        setLoadingImprovements(true);

        const { data, error } = await supabase
        .from("spot_improvements")
        .select(`
            id,
            spot_id,
            user_id,
            comment,
            photo_url,
            created_at,
            spots (
            id,
            name,
            type,
            lat,
            lng
            )
        `)
        .order("created_at", { ascending: false });

        if (error) {
        console.error("Error fetching improvements:", error);
        return;
        }

        setImprovements(data || []);
    } catch (error) {
        console.error("Unexpected error fetching improvements:", error);
    } finally {
        setLoadingImprovements(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email ?? null;
      setCurrentUserEmail(email);

      if (!user || email !== ADMIN_EMAIL) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      await loadReports();
      await fetchImprovements();
      setLoading(false);
    };

    init();
  }, []);

  const loadReports = async () => {
    const { data: reportsData, error: reportsError } = await supabase
      .from("spot_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportsError) {
      console.error("Error loading reports:", reportsError);
      alert("Could not load reports.");
      return;
    }

    const reportRows = (reportsData as SpotReport[]) || [];
    setReports(reportRows);

    const uniqueSpotIds = [...new Set(reportRows.map((r) => r.spot_id))];
    const uniqueUserIds = [...new Set(reportRows.map((r) => r.user_id))];

    if (uniqueSpotIds.length > 0) {
      const { data: spotsData, error: spotsError } = await supabase
        .from("spots")
        .select("id, name, type, lat, lng, description, source, user_id, community_owned")
        .in("id", uniqueSpotIds);

      if (spotsError) {
        console.error("Error loading related spots:", spotsError);
      } else {
        const nextSpotsMap: Record<number, Spot> = {};
        ((spotsData as Spot[]) || []).forEach((spot) => {
          nextSpotsMap[spot.id] = spot;
        });
        setSpotsMap(nextSpotsMap);
      }
    } else {
      setSpotsMap({});
    }

    if (uniqueUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", uniqueUserIds);

      if (profilesError) {
        console.error("Error loading related profiles:", profilesError);
      } else {
        const nextProfilesMap: Record<string, string> = {};
        ((profilesData as Profile[]) || []).forEach((profile) => {
          nextProfilesMap[profile.id] = profile.username || "Unnamed user";
        });
        setProfilesMap(nextProfilesMap);
      }
    } else {
      setProfilesMap({});
    }
  };

  const reloadAll = async () => {
    await loadReports();
    await fetchImprovements();
  };

  const handleAcceptImprovement = async (item: any) => {
    const { spot_id, comment, photo_url, id } = item;

    // 1. Récupérer le spot actuel
    const { data: spot, error: spotError } = await supabase
        .from("spots")
        .select("*")
        .eq("id", spot_id)
        .single();

    if (spotError || !spot) {
        alert("Could not find spot");
        return;
    }

    // 2. Construire update
    const updatedData: any = {};

    if (photo_url) {
        updatedData.photo_url = photo_url;
    }

    if (comment) {
        updatedData.description = spot.description
        ? spot.description + "\n\n" + comment
        : comment;
    }

    // 👉 rendre community
    updatedData.community_owned = true;

    // 3. Update du spot
    const { error: updateError } = await supabase
        .from("spots")
        .update(updatedData)
        .eq("id", spot_id);

    if (updateError) {
    console.error("Error updating spot:", updateError);
    alert(updateError.message);
    return;
    }

    // 4. Supprimer l'amélioration
    const { error: deleteError } = await supabase
    .from("spot_improvements")
    .delete()
    .eq("id", id);

    if (deleteError) {
    console.error("Error deleting improvement:", deleteError);
    alert(deleteError.message);
    return;
    }

    // 5. Refresh
    await reloadAll();
    alert(`Improvement accepted ✅ for spot ${spot_id}`);

};

  const groupedReports = useMemo(() => {
    return reports.map((report) => ({
      report,
      spot: spotsMap[report.spot_id],
      reporterName: profilesMap[report.user_id] || "Unknown user",
    }));
  }, [reports, spotsMap, profilesMap]);

  const handleIgnoreReport = async (reportId: number) => {
    setIgnoringReportId(reportId);

    const { error } = await supabase
      .from("spot_reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      console.error("Error ignoring report:", error);
      alert("Could not ignore report.");
      setIgnoringReportId(null);
      return;
    }

    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setIgnoringReportId(null);
  };

  const handleDeleteSpot = async (spotId: number) => {
    const confirmed = window.confirm(
      "Delete this spot? This cannot be undone."
    );

    if (!confirmed) return;

    setDeletingSpotId(spotId);

    const { error } = await supabase.from("spots").delete().eq("id", spotId);

    if (error) {
      console.error("Error deleting spot:", error);
      alert("Could not delete spot.");
      setDeletingSpotId(null);
      return;
    }

    setReports((prev) => prev.filter((r) => r.spot_id !== spotId));
    setDeletingSpotId(null);
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-black">
          Loading admin reports...
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-4 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-black space-y-3">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="text-sm text-gray-600">
            This page is restricted to the admin account.
          </p>
          <p className="text-xs text-gray-500">
            Signed in as: {currentUserEmail || "Not signed in"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            Back to map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto w-full bg-gray-50 min-h-screen">
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => router.push("/")}
          className="bg-black text-white px-4 py-2 rounded-xl"
        >
          ← Back to map
        </button>

        <button
          onClick={reloadAll}
          className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-black">Admin reports</h1>
        <p className="text-sm text-gray-500">
          Review reported spots and decide what to do.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 border border-gray-200 mt-6">
        <h2 className="text-xl font-bold mb-4">Spot Improvements</h2>

        {loadingImprovements ? (
            <p className="text-gray-500">Loading improvements...</p>
        ) : improvements.length === 0 ? (
            <p className="text-gray-500">No improvements yet.</p>
        ) : (
            <div className="space-y-4">
            {improvements.map((item) => (
                <div
                key={item.id}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                >
                <div className="text-sm text-gray-500 mb-2">
                {item.spots?.name || `Spot ID: ${item.spot_id}`}
                {item.spots?.type ?  `• ${item.spots.type}` : ""}
                </div>

                {item.comment && (
                    <p className="text-sm text-black mb-3 whitespace-pre-line">
                    {item.comment}
                    </p>
                )}

                {item.photo_url && (
                    <img
                    src={item.photo_url}
                    alt="Improvement"
                    className="w-full max-w-sm rounded-xl border border-gray-200 mb-3"
                    />
                )}

                {item.spots?.lat && item.spots?.lng && (
                    <button
                    onClick={() =>
                        router.push(
                        `/?lat=${item.spots.lat}&lng=${item.spots.lng}&spotId=${item.spot_id}`
                        )
                    }
                    className="bg-white text-black border border-gray-300 px-3 py-2 rounded-xl text-sm mb-3"
                    >
                    View spot on map
                    </button>
                )}

                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => handleAcceptImprovement(item)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
                    >
                        Accept
                    </button>

                    <button
                        onClick={async () => {
                        const { error } = await supabase
                            .from("spot_improvements")
                            .delete()
                            .eq("id", item.id);

                        if (error) {
                            console.error("Reject improvement error:", error);
                            alert(`Reject error: ${error.message}`);
                            return;
                        }

                        alert(`Improvement rejected for spot ${item.spot_id}`);
                        await reloadAll();
                        }}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
                    >
                        Reject
                    </button>
                    </div>
    
                <div className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                </div>
                </div>
            ))}
            </div>
        )}
        </div>

      {groupedReports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-black">
          No reports yet.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedReports.map(({ report, spot, reporterName }) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl shadow p-5 border border-gray-200 text-black"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold">
                      {spot?.name || `Spot #${report.spot_id}`}
                    </h2>
                    {spot?.type && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {spot.type}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600">
                    Reason:{" "}
                    <span className="font-medium text-gray-800">
                      {report.reason}
                    </span>
                  </p>

                  <p className="text-sm text-gray-600">
                    Reported by:{" "}
                    <span className="font-medium text-gray-800">
                      {reporterName}
                    </span>
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(report.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>

                {spot && (
                  <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                    <p>
                      <span className="font-medium">Spot ID:</span> {spot.id}
                    </p>
                    <p>
                      <span className="font-medium">Source:</span>{" "}
                        {spot.source === "user" || spot.community_owned
                        ? "Community"
                        : spot.source || "Unknown"}
                    </p>
                    <p>
                      <span className="font-medium">Coordinates:</span>{" "}
                      {spot.lat}, {spot.lng}
                    </p>
                    {spot.description && (
                      <p className="whitespace-pre-line">
                        <span className="font-medium">Description:</span>{" "}
                        {spot.description}
                      </p>
                    )}
                  </div>
                )}

                {report.comment && (
                  <div className="bg-yellow-50 rounded-xl p-4 text-sm whitespace-pre-line">
                    <span className="font-medium">Comment:</span>{" "}
                    {report.comment}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                onClick={() =>
                    router.push(`/?lat=${spot.lat}&lng=${spot.lng}&spotId=${spot.id}`)
                }
                className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
                >
                View spot on map
                </button>

                  <button
                    onClick={() => handleIgnoreReport(report.id)}
                    disabled={ignoringReportId === report.id}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {ignoringReportId === report.id ? "Ignoring..." : "Ignore"}
                  </button>

                  {spot && (
                    <button
                      onClick={() => handleDeleteSpot(spot.id)}
                      disabled={deletingSpotId === spot.id}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                    >
                      {deletingSpotId === spot.id
                        ? "Deleting..."
                        : "Delete spot"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}