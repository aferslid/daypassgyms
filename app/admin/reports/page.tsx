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
        .select("id, name, type, lat, lng, description, source, user_id")
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
          onClick={loadReports}
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
                      {spot.source === "user"
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