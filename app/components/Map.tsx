"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { supabase } from "@/lib/supabase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import AddSpotForm from "./AddSpotForm";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import countriesList from "world-countries";

// Fix icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Spot = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  user_id?: string | null;
  photo_url?: string | null;
  created_at?: string | null;
  details?: Record<string, any> | null;
  source?: string | null;
  country?: string;
  community_owned?: boolean | null;
};

type MapMarker = {
  kind: "spot" | "cluster";
  id: number | null;
  name: string | null;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  photo_url: string | null;
  point_count: number;
};

type Profile = {
  id: string;
  username: string;
  created_at?: string;
};

type PendingPosition = {
  lat: number;
  lng: number;
} | null;

function AddSpotMapClick({
  isSelectingLocation,
  setPendingPosition,
}: {
  isSelectingLocation: boolean;
  setPendingPosition: (pos: PendingPosition) => void;
}) {
  useMapEvents({
    click(e) {
      if (!isSelectingLocation) return;

      setPendingPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

function MapSpotSelectionHandler({
  selectedSpot,
  setSelectedSpot,
  setImprovingSpotId,
  setReportingSpotId,
}: {
  selectedSpot: Spot | null;
  setSelectedSpot: (spot: Spot | null) => void;
  setImprovingSpotId: (id: number | null) => void;
  setReportingSpotId: (id: number | null) => void;
}) {
  useMapEvents({
    click() {
      if (!selectedSpot) return;
      setSelectedSpot(null);
      setImprovingSpotId(null);
      setReportingSpotId(null);
    },
  });

  return null;
}

function MapBoundsUpdater({
  setBounds,
  isPopupOpenRef,
}: {
  setBounds: React.Dispatch<
    React.SetStateAction<{
      north: number;
      south: number;
      east: number;
      west: number;
    } | null>
  >;
  isPopupOpenRef: React.MutableRefObject<boolean>;
}) {
  const map = useMapEvents({
    moveend: () => {
      

      const b = map.getBounds();

      const nextBounds = {
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      };

      setBounds((prev) => {
        if (
          prev &&
          prev.north === nextBounds.north &&
          prev.south === nextBounds.south &&
          prev.east === nextBounds.east &&
          prev.west === nextBounds.west
        ) {
          return prev;
        }

        return nextBounds;
      });
    },
  });

  return null;
}

function MapZoomUpdater({ setZoomLevel }: { setZoomLevel: any }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoomLevel(map.getZoom());
    },
  });

  return null;
}

function createClusterCustomIcon(cluster: any) {
  const count = cluster.getChildCount();

  let size = 38;
  let fontSize = 14;

  if (count >= 10) {
    size = 42;
    fontSize = 15;
  }

  if (count >= 100) {
    size = 48;
    fontSize = 16;
  }

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:9999px;
        background:#2563eb;
        border:3px solid white;
        box-shadow:0 6px 16px rgba(0,0,0,0.25);
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-weight:700;
        font-size:${fontSize}px;
      ">
        ${count}
      </div>
    `,
    className: "",
    iconSize: [size, size],
  });
}

function SpotReportForm({
  spotId,
  user,
  onClose,
}: {
  spotId: number;
  user: any;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmitReport = async () => {
    if (!user) {
      alert("You need to sign in to report a spot.");
      return;
    }

    setSending(true);

    const { error } = await supabase.from("spot_reports").insert({
      spot_id: spotId,
      user_id: user.id,
      reason: "spot_no_longer_exists",
      comment: comment.trim() || null,
    });

    if (error) {
      console.error("Error sending report:", error);
      alert("Could not send report.");
      setSending(false);
      return;
    }

    alert("Report sent.");
    setSending(false);
    onClose();
  };

  return (
    <div className="mt-2 p-3 border rounded-lg bg-gray-50 space-y-2">
      <p className="text-sm text-gray-700">
        Report that this spot no longer exists.
      </p>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional explanation..."
        className="w-full border rounded-lg px-3 py-2 text-sm min-h-[70px]"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSubmitReport}
          disabled={sending}
          className="px-3 py-2 rounded-lg text-sm bg-red-500 text-white"
        >
          {sending ? "Sending..." : "Send report"}
        </button>

        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

async function getCountryCodeFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "TravelerSurvivalMap/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error("Reverse geocoding failed:", response.status);
      return null;
    }

    const data = await response.json();
    const countryCode = data?.address?.country_code;

    return countryCode ? String(countryCode).toUpperCase() : null;
  } catch (error) {
    console.error("Error reverse geocoding country:", error);
    return null;
  }
}

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

function MapDeepLinkUpdater({
  lat,
  lng,
  onApplied,
  setBounds,
  setZoomLevel,
}: {
  lat: string | null;
  lng: string | null;
  onApplied: () => void;
  setBounds: React.Dispatch<
    React.SetStateAction<{
      north: number;
      south: number;
      east: number;
      west: number;
    } | null>
  >;
  setZoomLevel: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!lat || !lng) return;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    const timeout = setTimeout(() => {
      map.setView([parsedLat, parsedLng], 16);

      const b = map.getBounds();
      setBounds({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });

      setZoomLevel(map.getZoom());
      onApplied();

      window.history.replaceState({}, "", "/");
    }, 400);

    return () => clearTimeout(timeout);
  }, [lat, lng, map, onApplied, setBounds, setZoomLevel]);

  return null;
}

function SpotImprovementForm({
  spotId,
  user,
  onClose,
}: {
  spotId: number;
  user: any;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmitImprovement = async () => {
    if (!user) {
      alert("You need to sign in to improve a spot.");
      return;
    }

    if (!comment.trim() && !photoFile) {
      alert("Please add at least a comment or a photo.");
      return;
    }

    setSending(true);

    let uploadedPhotoUrl: string | null = null;

    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `improvement-${spotId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("spot-photos")
        .upload(`uploads/${fileName}`, photoFile);

      if (uploadError) {
        console.error("Error uploading improvement photo:", uploadError);
        alert("Could not upload photo.");
        setSending(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("spot-photos")
        .getPublicUrl(`uploads/${fileName}`);

      uploadedPhotoUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("spot_improvements").insert({
      spot_id: spotId,
      user_id: user.id,
      comment: comment.trim() || null,
      photo_url: uploadedPhotoUrl,
    });

    if (error) {
      console.error("Error sending improvement:", error);
      alert("Could not send improvement.");
      setSending(false);
      return;
    }

    alert("Improvement sent.");
    setComment("");
    setPhotoFile(null);
    setSending(false);
    onClose();
  };

  return (
    <div className="mt-2 p-3 border rounded-lg bg-gray-50 space-y-2">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add missing info, corrections, or useful details..."
        className="w-full border rounded-lg px-3 py-2 text-sm min-h-[90px]"
      />

      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer border rounded-lg px-3 py-2 text-sm text-center bg-white">
          📷 Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setPhotoFile(file);
            }}
          />
        </label>

        <label className="flex-1 cursor-pointer border rounded-lg px-3 py-2 text-sm text-center bg-white">
          🖼️ Gallery
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setPhotoFile(file);
            }}
          />
        </label>
      </div>

      {photoFile && (
        <p className="text-xs text-gray-600">
          Selected photo: {photoFile.name}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSubmitImprovement}
          disabled={sending || (!comment.trim() && !photoFile)}
          className={`px-3 py-2 rounded-lg text-sm ${
            !comment.trim() && !photoFile
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-black text-white"
          }`}
        >
          {sending ? "Sending..." : "Send improvement"}
        </button>

        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Map() {
  const mapRef = useRef<L.Map | null>(null);

  const [category, setCategory] = useState<string>("atm");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<PendingPosition>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [contributionsCount, setContributionsCount] = useState(0);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [bounds, setBounds] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(6)
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const isPopupOpenRef = useRef(false);
  const saveLockRef = useRef(false);
  const router = useRouter();
  const [confirmCounts, setConfirmCounts] = useState<Record<number, number>>({});
  const [confirmedSpotIds, setConfirmedSpotIds] = useState<number[]>([]);
  const [confirmingSpotId, setConfirmingSpotId] = useState<number | null>(null);
  const [reportingSpotId, setReportingSpotId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const deepLinkLat = searchParams.get("lat");
  const deepLinkLng = searchParams.get("lng");
  const deepLinkSpotId = searchParams.get("spotId");
  const [hasAppliedDeepLink, setHasAppliedDeepLink] = useState(false);
  const [improvingSpotId, setImprovingSpotId] = useState<number | null>(null);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [fullscreenImageAlt, setFullscreenImageAlt] = useState<string>("");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  const categoriesRequiringZoom = [
    "atm",
    "wc",
    "water",
    "charge",
    "wifi",
    "coffee",
    "rest",
    "luggage",
    "mailbox",
    "tourist_info",
    "viewpoint",
    "gym",
    "street_workout",
    "coworking",
    "healthy_food",
    "sim",
    "cheap_food",
    "activity",
    "tattoo",
  ];
  
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

useEffect(() => {
  if (!selectedSpot) return;

  if (selectedSpot.type !== category) {
    setSelectedSpot(null);
  }
}, [category, selectedSpot]);

useEffect(() => {
  if (!selectedSpot) return;

  const stillVisible = spots.some((spot) => spot.id === selectedSpot.id);
  if (!stillVisible) {
    setSelectedSpot(null);
    setImprovingSpotId(null);
    setReportingSpotId(null);
  }
}, [spots, selectedSpot]);

useEffect(() => {
  const fetchMapMarkers = async () => {
    if (!bounds) return;

    const { data, error } = await supabase.rpc("get_map_markers", {
      min_lat: bounds.south,
      min_lng: bounds.west,
      max_lat: bounds.north,
      max_lng: bounds.east,
      zoom_level: zoomLevel,
      spot_type: category,
    });

    if (error) {
      console.error("Erreur RPC get_map_markers:", error);
      return;
    }

    const markers = (data as MapMarker[]) || [];
    setMapMarkers(markers);

    const realSpots = markers
      .filter((m) => m.kind === "spot" && m.id !== null)
      .map((m) => ({
        id: m.id as number,
        name: m.name || "",
        type: m.type,
        lat: m.lat,
        lng: m.lng,
        description: m.description,
        photo_url: m.photo_url,
      })) as Spot[];

    setSpots(realSpots);
  };

  const timeout = setTimeout(() => {
    fetchMapMarkers();
  }, 250);

  return () => clearTimeout(timeout);
}, [bounds, category, zoomLevel]);

  useEffect(() => {
    if (hasAppliedDeepLink) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [hasAppliedDeepLink]);

  useEffect(() => {
    if (hasAppliedDeepLink) return;
    if (!userPosition || !mapRef.current || hasCenteredOnUser) return;

    mapRef.current.setView([userPosition.lat, userPosition.lng], 6);
    setHasCenteredOnUser(true);
  }, [userPosition, hasCenteredOnUser, hasAppliedDeepLink]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsProfileLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Aucun profil pour l'instant ou erreur:", error.message);
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }

      setIsProfileLoading(false);
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username");

      if (error) {
        console.error("Erreur profiles:", error);
        return;
      }

      const map: Record<string, string> = {};

      (data || []).forEach((profile: any) => {
        map[profile.id] = profile.username;
      });

      setProfilesMap(map);
    };

    fetchProfiles();
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setContributionsCount(0);
      return;
    }

    const fetchContributionsCount = async () => {
      const { count, error } = await supabase
        .from("spots")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) {
        console.error("Erreur compteur contributions:", error);
        return;
      }

      setContributionsCount(count || 0);
    };

    fetchContributionsCount();
  }, [user, spots]);

  const matchesCategory = (spotType: string) => {
    return spotType === category;
  };

  const resetAddForm = () => {
    setPendingPosition(null);
    setIsSelectingLocation(false);
    setShowAddForm(false);
 };

  const getFreshUserPosition = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserPosition(coords);
          resolve(coords);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const recenterOnUser = async () => {
    try {
      const coords = await getFreshUserPosition();
      if (!mapRef.current) return;
      mapRef.current.flyTo([coords.lat, coords.lng], 13);
    } catch (error) {
      console.error("Error getting fresh position:", error);
      alert("Could not get your current position.");
    }
  };

  const handleSaveSpot = async (
    name: string,
    type: string,
    description: string,
    file: File | null,
    details: Record<string, any>
  ) => {
    if (saveLockRef.current) return;

    if (!user) {
      alert("You need to sign in to add a spot.");
      return;
    }

    if (!pendingPosition) {
      alert("Choisis un emplacement.");
      return;
    }

    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    saveLockRef.current = true;
    setIsSaving(true);

    try {
      let photoUrl = null;

      if (file) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("spot-photos")
          .upload(`uploads/${fileName}`, file);

        if (uploadError) {
          console.error("Erreur upload photo:", uploadError);
          alert("Erreur upload photo");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("spot-photos")
          .getPublicUrl(`uploads/${fileName}`);

        photoUrl = publicUrlData.publicUrl;
      }

      const countryCode = await getCountryCodeFromCoords(
        pendingPosition.lat,
        pendingPosition.lng
      );

      const countryName =
        countryOptions.find((c) => c.code === countryCode)?.name || countryCode;

      const flag = countryCode ? getFlagEmoji(countryCode) : "🌍";

      const normalizedDetails = Object.fromEntries(
        Object.entries(details).map(([key, value]) => {
          if (value === "yes") return [key, true];
          if (value === "no") return [key, false];
          return [key, value];
        })
      );

      const { data, error } = await supabase
        .from("spots")
        .insert([
          {
            name: name.trim(),
            type,
            lat: pendingPosition.lat,
            lng: pendingPosition.lng,
            description: description.trim() || null,
            user_id: user?.id || null,
            photo_url: photoUrl,
            source: "user",
            country: countryCode,
            details: normalizedDetails,
          },
        ])
        .select();

      if (error) {
        console.error("Erreur insertion spot:", error);
        alert(error.message);
        return;
      }

      if (data && data.length > 0) {
        setSpots((prev) => [...prev, data[0] as Spot]);
      }

      resetAddForm();
      alert(`You just added a new spot in ${countryName || "this area"} ${flag}`);
    } catch (err) {
      console.error("Unexpected error while saving spot:", err);
      alert("Unexpected error while saving spot.");
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);
    }
  };

  const handleAddAtMyPosition = async () => {
    if (!user) {
      alert("You need to sign in to add a spot.");
      return;
    }

    try {
      const coords = await getFreshUserPosition();

      setIsSelectingLocation(false);
      setPendingPosition({
        lat: coords.lat,
        lng: coords.lng,
      });
      setShowAddForm(true);
    } catch (error) {
      console.error("Error getting fresh position:", error);
      alert("Could not get your current position.");
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    // 👉 1. tentative signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // 👉 2. gestion erreurs
    if (error) {
      alert(error.message);
      return;
    }

    // 👉 3. CAS IMPORTANT
    if (data?.user?.identities?.length === 0) {
      // 👉 email déjà existant
      alert("An account already exists with this email. Try logging in.");
      setAuthMode("signin");
      return;
    }

    // 👉 4. succès réel
    alert("Account created! Check your email (and spam folder).");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email et mot de passe requis");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);
      alert("Connecté");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    alert("Disconnected.");
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://travelersurvivalmap.com/reset-password",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password reset email sent. Check your inbox.");
  };

  const handleCreateProfile = async () => {
    if (!user || !username.trim()) {
      alert("Username required");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          username: cleanUsername,
        },
        {
          onConflict: "id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving profile:", error);

      if (
        error.message.toLowerCase().includes("duplicate") ||
        error.message.toLowerCase().includes("unique")
      ) {
        alert("This username is already taken. Please choose another one.");
        return;
      }

      alert(error.message);
      return;
    }

    setProfile(data as Profile);
    alert("Username saved!");
  };

  const handleDeleteSpot = async (spotId: number) => {
    const confirmed = window.confirm("Delete this spot ?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("spots")
      .delete()
      .eq("id", spotId);

    if (error) {
      console.error("Error deleting spot:", error);
      alert(error.message);
      return;
    }

    setSpots((prev) => prev.filter((spot) => spot.id !== spotId));
    alert("Spot deleted.");
  };

  const fetchConfirmationData = async (spotId: number) => {
    const { data, error } = await supabase
      .from("spot_confirmations")
      .select("user_id")
      .eq("spot_id", spotId);

    if (error) {
      console.error("Error fetching confirmations:", error);
      return;
    }

    const count = data?.length || 0;

    setConfirmCounts((prev) => ({
      ...prev,
      [spotId]: count,
    }));

    if (user?.id) {
      const hasConfirmed = (data || []).some((row) => row.user_id === user.id);

      setConfirmedSpotIds((prev) => {
        const alreadyIncluded = prev.includes(spotId);

        if (hasConfirmed && !alreadyIncluded) {
          return [...prev, spotId];
        }

        if (!hasConfirmed && alreadyIncluded) {
          return prev.filter((id) => id !== spotId);
        }

        return prev;
      });
    }
  };

  const handleConfirmSpot = async (spotId: number) => {
    if (!user) {
      alert("You need to sign in to confirm a spot.");
      return;
    }

    if (confirmedSpotIds.includes(spotId)) {
      return;
    }

    setConfirmingSpotId(spotId);

    const { error } = await supabase.from("spot_confirmations").insert({
      spot_id: spotId,
      user_id: user.id,
    });

    if (error) {
      console.error("Error confirming spot:", error);

      if (error.message?.toLowerCase().includes("duplicate")) {
        setConfirmedSpotIds((prev) =>
          prev.includes(spotId) ? prev : [...prev, spotId]
        );
      } else {
        alert("Could not confirm this spot.");
      }

      setConfirmingSpotId(null);
      return;
    }

    const { error: communityOwnedError } = await supabase
      .from("spots")
      .update({ community_owned: true })
      .eq("id", spotId);

    if (communityOwnedError) {
      console.error("Error setting community_owned:", communityOwnedError);
    }

    setConfirmedSpotIds((prev) =>
      prev.includes(spotId) ? prev : [...prev, spotId]
    );

    setConfirmCounts((prev) => ({
      ...prev,
      [spotId]: (prev[spotId] || 0) + 1,
    }));

    setConfirmingSpotId(null);
  };

  const getMarkerIcon = (type: string, isSelected = false) => {
    let icon = "📍";
    let color = "#3b82f6";
    let size = isSelected ? 40 : 32;
    let fontSize = isSelected ? 18 : 16;
    let ring = isSelected ? "0 0 0 4px white, 0 0 0 8px rgba(0,0,0,0.18)" : "0 0 0 2px white";

    if (type === "water") {
      icon = "💧";
      color = "#06b6d4";
    }

    if (type === "wc") {
      icon = "🚻";
      color = "#22c55e";
    }

    if (type === "atm") {
      icon = "💳";
      color = "#8b5cf6";
    }

    if (type === "charge") {
      icon = "🔌";
      color = "#f97316";
    }

    if (type === "rest") {
      icon = "🪑";
      color = "#84cc16";
    }
    if (type === "coffee") {
      icon = "☕";
      color = "#92400e";
    }
    if (type === "luggage") {
      icon = "🧳";
      color = "#2563eb";
    }
    if (type === "wifi") {
      icon = "📶";
      color = "#14b8a6";
    }
    if (type === "mailbox") {
      icon = "📮";
      color = "#ef4444";
    }

    if (type === "tourist_info") {
  icon = "ℹ️";
  color = "#0ea5e9";
}

if (type === "viewpoint") {
  icon = "📍";
  color = "#8b5cf6";
}

if (type === "gym") {
  icon = "🏋️";
  color = "#ef4444";
}

if (type === "street_workout") {
  icon = "💪";
  color = "#f97316";
}

if (type === "coworking") {
  icon = "💻";
  color = "#06b6d4";
}

if (type === "healthy_food") {
  icon = "🥗";
  color = "#22c55e";
}

if (type === "sim") {
  icon = "📱";
  color = "#6366f1"; // violet/bleu
}

if (type === "cheap_food") {
  icon = "🍜";
  color = "#f59e0b"; // orange
}

if (type === "activity") {
  icon = "🎟️";
  color = "#ec4899"; // rose
}

if (type === "tattoo") {
  icon = "🖋️";
  color = "#111827"; // noir
}

    return L.divIcon({
      html: `
        <div style="
          background:${color};
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${fontSize}px;
          box-shadow:${ring};
          transform:${isSelected ? "scale(1.05)" : "scale(1)"};
          transition:all 0.15s ease;
        ">
          ${icon}
        </div>
      `,
      className: "",
      iconSize: [size, size],
    });
  };

  const categories = [
  { value: "atm", label: "ATM", icon: "🏧" },
  { value: "wc", label: "WC", icon: "🚻" },
  { value: "water", label: "Water", icon: "💧" },
  { value: "charge", label: "Charge", icon: "⚡" },
  { value: "rest", label: "Rest", icon: "🪑" },
  { value: "coffee", label: "Coffee", icon: "☕" },
  { value: "luggage", label: "Luggage", icon: "🧳" },
  { value: "wifi", label: "WiFi", icon: "📶" },
  { value: "mailbox", label: "Mailbox", icon: "📮" },
  { value: "tourist_info", label: "Info Center", icon: "ℹ️" },
  { value: "viewpoint", label: "Viewpoint", icon: "📍" },
  { value: "gym", label: "Gym", icon: "🏋️" },
  { value: "street_workout", label: "Street", icon: "💪" },
  { value: "coworking", label: "Cowork", icon: "💻" },
  { value: "healthy_food", label: "Healthy", icon: "🥗" },
  { value: "sim", label: "SIM", icon: "📱" },
  { value: "cheap_food", label: "Cheap food", icon: "🍜" },
  { value: "activity", label: "Activity", icon: "🎟️" },
  { value: "tattoo", label: "Tattoo", icon: "🖋️" },
  ];

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden">
      <MapContainer
      center={[46.603354, 1.888334]}
      zoom={6}
      scrollWheelZoom={true}
      className="h-full w-full"
      ref={mapRef}>

        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapDeepLinkUpdater
          lat={deepLinkLat}
          lng={deepLinkLng}
          onApplied={() => setHasAppliedDeepLink(true)}
          setBounds={setBounds}
          setZoomLevel={setZoomLevel}
        />

        <MapBoundsUpdater setBounds={setBounds} isPopupOpenRef={isPopupOpenRef} />

        <MapZoomUpdater setZoomLevel={setZoomLevel} />

        <AddSpotMapClick
          isSelectingLocation={isSelectingLocation}
          setPendingPosition={setPendingPosition}
        />

        <MapSpotSelectionHandler
          selectedSpot={selectedSpot}
          setSelectedSpot={setSelectedSpot}
          setImprovingSpotId={setImprovingSpotId}
          setReportingSpotId={setReportingSpotId}
        />

        {userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={L.divIcon({
              className: "",
              html: `<div style="
                width:18px;
                height:18px;
                background:#1E90FF;
                border-radius:50%;
                border:3px solid white;
                box-shadow:0 0 0 8px rgba(30,144,255,0.35);
              "></div>`,
            })}
          >
            <Popup>Tu es ici</Popup>
          </Marker>
        )}

        <>
          {mapMarkers.map((marker, index) => {
            if (marker.kind === "cluster") {
              const count = marker.point_count;

              // format 1500 → 1.5k
              const label =
                count >= 1000
                  ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
                  : `${count}`;

              // taille dynamique
              const size =
                count < 10 ? 38 :
                count < 100 ? 44 :
                count < 1000 ? 50 : 56;

              const clusterIcon = L.divIcon({
                html: `
                  <div style="
                    width:${size}px;
                    height:${size}px;
                    border-radius:9999px;

                    background: radial-gradient(circle at 30% 30%, #60a5fa, #2563eb);
                    
                    border:3px solid rgba(255,255,255,0.95);

                    box-shadow:
                      0 8px 20px rgba(37,99,235,0.35),
                      inset 0 1px 2px rgba(255,255,255,0.4);

                    display:flex;
                    align-items:center;
                    justify-content:center;

                    color:white;
                    font-weight:800;
                    font-size:${count >= 1000 ? 14 : 15}px;
                    letter-spacing:-0.3px;
                  ">
                    ${label}
                  </div>
                `,
                className: "",
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
              });

              return (
                <Marker
                  key={`cluster-${marker.type}-${index}-${marker.lat}-${marker.lng}`}
                  position={[marker.lat, marker.lng]}
                  icon={clusterIcon}
                  eventHandlers={{
                    click: () => {
                      if (!mapRef.current) return;
                      mapRef.current.setView(
                        [marker.lat, marker.lng],
                        Math.min(zoomLevel + 2, 18)
                      );
                    },
                  }}
                />
              );
            }

            const spot = spots.find((s) => s.id === marker.id);
            if (!spot) return null;

            return (
              <Marker
                key={`spot-${spot.id}`}
                position={[spot.lat, spot.lng]}
                icon={getMarkerIcon(spot.type, selectedSpot?.id === spot.id)}
                eventHandlers={{
                  click: () => {
                    setSelectedSpot(spot);
                    fetchConfirmationData(spot.id);
                  },
                }}
              />
            );
          })}
        </>

        {pendingPosition && (
          <Marker position={[pendingPosition.lat, pendingPosition.lng]}> </Marker>
        )}
      </MapContainer>

            {selectedSpot && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-[86vw] max-w-[300px] pointer-events-auto">
          <div className="bg-white/98 backdrop-blur-md shadow-2xl rounded-2xl p-3 border border-gray-200 max-h-[52vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-base leading-tight text-black">
                  {selectedSpot.name}
                </h3>
                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                  {selectedSpot.type}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedSpot(null);
                  setImprovingSpotId(null);
                  setReportingSpotId(null);
                }}
                className="text-gray-400 hover:text-black text-lg leading-none"
              >
                ×
              </button>
            </div>

            {selectedSpot.description && (
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed mb-3">
                {selectedSpot.description}
              </p>
            )}

            <div className="space-y-1 text-sm text-gray-700">
              {selectedSpot.details?.location_type && (
                <p>
                  <span className="font-medium">ATM:</span>{" "}
                  {selectedSpot.details.location_type}
                </p>
              )}

              {selectedSpot.details?.fee_value !== undefined && (
                <p>
                  <span className="font-medium">Fees:</span>{" "}
                  {selectedSpot.details.fee_value}
                  {selectedSpot.details.fee_type === "percent" ? "%" : ""}
                  {selectedSpot.details.fee_type === "currency" &&
                  selectedSpot.details.currency
                    ?  `${selectedSpot.details.currency}`
                    : ""}
                </p>
              )}

              {selectedSpot.details?.free !== undefined && (
                <p>
                  <span className="font-medium">Free:</span>{" "}
                  {selectedSpot.details.free ? "Yes" : "No"}
                </p>
              )}

              {selectedSpot.details?.pmr !== undefined && (
                <p>
                  <span className="font-medium">PMR:</span>{" "}
                  {selectedSpot.details.pmr ? "Yes" : "No"}
                </p>
              )}

              {selectedSpot.details?.drinkable !== undefined && (
                <p>
                  <span className="font-medium">Drinkable:</span>{" "}
                  {selectedSpot.details.drinkable ? "Yes" : "No"}
                </p>
              )}

              {selectedSpot.details?.consumption_required !== undefined && (
                <p>
                  <span className="font-medium">Consumption required:</span>{" "}
                  {selectedSpot.details.consumption_required ? "Yes" : "No"}
                </p>
              )}

              {selectedSpot.details?.network_name && (
                <p>
                  <span className="font-medium">WiFi:</span>{" "}
                  {selectedSpot.details.network_name}
                </p>
              )}

              {selectedSpot.details?.password && (
                <p>
                  <span className="font-medium">Password:</span>{" "}
                  {selectedSpot.details.password}
                </p>
              )}

              {selectedSpot.details?.day_pass_price !== undefined && (
                <p>
                  <span className="font-medium">💰 Day pass:</span>{" "}
                  {selectedSpot.details.day_pass_price === 0
                    ? "Free"
                    : selectedSpot.details.day_pass_price !== null
                    ? `${new Intl.NumberFormat().format(selectedSpot.details.day_pass_price)}${
                        selectedSpot.details.currency
                          ?  `${selectedSpot.details.currency}`
                          : ""
                      }`
                    : "Unknown"}
                </p>
              )}

              {selectedSpot.details?.shower !== undefined && (
                <p>
                  <span className="font-medium">🚿 Shower:</span>{" "}
                  {selectedSpot.details.shower === true
                    ? "Yes"
                    : selectedSpot.details.shower === false
                    ? "No"
                    : "Unknown"}
                </p>
              )}

              {selectedSpot.details?.reservation_required !== undefined && (
                <p>
                  <span className="font-medium">Reservation required:</span>{" "}
                  {selectedSpot.details.reservation_required ? "Yes" : "No"}
                </p>
              )}
            </div>

            {selectedSpot.photo_url && (
              <img
                src={selectedSpot.photo_url}
                alt={selectedSpot.name}
                className="w-full rounded-xl my-3 max-h-48 object-contain bg-gray-100 border cursor-zoom-in"
                onClick={() => {
                  setFullscreenImageUrl(selectedSpot.photo_url ?? null);
                  setFullscreenImageAlt(selectedSpot.name);
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}

            <div className="border-t pt-3 mt-3 space-y-1">
              {selectedSpot.user_id && profilesMap[selectedSpot.user_id] && (
                <div className="text-sm">
                  <span className="text-gray-500">Added by:</span>{" "}
                  <span
                    className="text-blue-600 cursor-pointer hover:underline"
                    onClick={() => router.push(`/user/${selectedSpot.user_id}`)}
                  >
                    {profilesMap[selectedSpot.user_id]}
                  </span>
                </div>
              )}

              {selectedSpot.created_at && (
                <p className="text-xs text-gray-500">
                  Added on {new Date(selectedSpot.created_at).toLocaleDateString("fr-FR")}
                </p>
              )}

              <p className="text-xs text-gray-400">
                Source:{" "}
                {selectedSpot.source === "user" || selectedSpot.community_owned
                  ? "Community"
                  : selectedSpot.source || "Unknown"}
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <p className="text-xs text-gray-500">
                Confirmed by {confirmCounts[selectedSpot.id] || 0} user
                {(confirmCounts[selectedSpot.id] || 0) > 1 ? "s" : ""}
              </p>

              <button
                onClick={() => handleConfirmSpot(selectedSpot.id)}
                disabled={
                  confirmingSpotId === selectedSpot.id ||
                  confirmedSpotIds.includes(selectedSpot.id)
                }
                className={`px-3 py-1 rounded-lg text-sm ${
                  confirmedSpotIds.includes(selectedSpot.id)
                    ? "bg-green-100 text-green-700 cursor-not-allowed"
                    : "bg-black text-white"
                }`}
              >
                {confirmedSpotIds.includes(selectedSpot.id)
                  ? "Confirmed"
                  : confirmingSpotId === selectedSpot.id
                  ? "Confirming..."
                  : "Confirm spot"}
              </button>

              <button
                onClick={() =>
                  setImprovingSpotId((prev) =>
                    prev === selectedSpot.id ? null : selectedSpot.id
                  )
                }
                className="px-3 py-1 rounded-lg text-sm border border-gray-300 bg-white"
              >
                Improve this spot
              </button>

              {improvingSpotId === selectedSpot.id && (
                <SpotImprovementForm
                  spotId={selectedSpot.id}
                  user={user}
                  onClose={() => setImprovingSpotId(null)}
                />
              )}

              <button
                onClick={() =>
                  setReportingSpotId((prev) =>
                    prev === selectedSpot.id ? null : selectedSpot.id
                  )
                }
                className="px-3 py-1 rounded-lg text-sm border border-gray-300 bg-white"
              >
                Spot no longer exists
              </button>

              {reportingSpotId === selectedSpot.id && (
                <SpotReportForm
                  spotId={selectedSpot.id}
                  user={user}
                  onClose={() => setReportingSpotId(null)}
                />
              )}

              {user && selectedSpot.user_id === user.id && (
                <button
                  onClick={() => handleDeleteSpot(selectedSpot.id)}
                  className="px-3 py-1 rounded-lg text-sm bg-red-500 text-white"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
   
      <div className="absolute bottom-6 sn:bottom-4 left-4 z-[1000] flex items-center gap-2 pointer-events-auto">
  
      <button
        onClick={() => setShowFiltersPanel((prev) => !prev)}
        className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-full px-4 py-2 text-sm text-black"
      >
        Filters
      </button>

      <div className="bg-black text-white rounded-full px-4 py-2 text-sm shadow-lg">
        {categories.find((c) => c.value === category)?.label}
      </div>

      </div>

      {showFiltersPanel && (
       <div className="absolute bottom-20 left-4 z-[1000] bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-3 w-52 pointer-events-auto flex flex-col gap-2 max-h-64 overflow-y-auto">
        {categories.map((cat) => (
         <button
         key={cat.value}
         onClick={() => {
          setCategory(cat.value);
          setShowFiltersPanel(false);
         }}
         className={`text-left px-3 py-2 rounded-xl text-sm ${
          category === cat.value ? "bg-black text-white" : "bg-gray-100 text-black hover:bg-gray-200"
         }`}
        >
          {cat.icon} {cat.label}
         </button>
        ))}
       </div>
      )}

      <div className="absolute top-5 right-4 z-[1000] pointer-events-auto flex flex-col gap-1.5 w-[170px]">
        <button
          onClick={() => {
            if (!user) {
              alert("You need to sign in to add a spot.");
              return;
            }

            if (isSelectingLocation || showAddForm) {
              resetAddForm();
            } else {
              setIsSelectingLocation(true);
              setShowAddForm(false);
              setPendingPosition(null);
            }
          }}
          className="bg-black text-white px-4 py-2 rounded-2xl shadow-lg border border-black active:scale-95 text-sm font-medium w-full"
        >
          {isSelectingLocation || showAddForm ? "Cancel" : "Add spot"}
          </button>

        <button
          onClick={handleAddAtMyPosition}
          className="bg-blue-600 text-white px-4 py-2 rounded-2xl shadow-lg border border-blue-700 active:scale-95 text-sm font-medium w-full"
        >
          Add at my location
        </button>

        <button
          onClick={recenterOnUser}
          className="bg-white text-black px-4 py-2 rounded-2xl shadow-lg border border-gray-300 active:scale-95 text-sm font-medium w-full"
        >
          📍 Center on me
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="bg-white text-black px-4 py-2 rounded-2xl shadow-lg border border-gray-300 active:scale-95 text-sm font-medium w-full"
        >
          Profile
        </button>

      </div>

      {isSelectingLocation && !showAddForm && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-lg rounded-full px-4 py-2 text-sm pointer-events-auto">
          Click on the map to choose location
        </div>
      )}

      {isSelectingLocation && pendingPosition && !showAddForm && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
          <button
           onClick={() => {
            setIsSelectingLocation(false);
            setShowAddForm(true);
           }}
           className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg"
          >
           ✓ Confirm the location
          </button>
        </div>
      )}

      <AddSpotForm
        key={showAddForm ? "open" : "closed"}
        showAddForm={showAddForm}
        isSaving={isSaving}
        handleSaveSpot={handleSaveSpot}
        resetAddForm={resetAddForm}
      />

      <div className="absolute top-4 left-4 z-[1000] bg-white shadow-xl rounded-2xl p-3 sm:p-4 w-[170px] sm:w-[220px] pointer-events-auto">
      
        {user && isProfileLoading ? (
          <div>
            <p className="text-sm text-gray-500">Loading profile...</p>
          </div>
        ) : user && (!profile || !profile.username) ? (

          <div>
            <h2 className="font-bold text-lg mb-3">Pick a username</h2>

            <input
              type="text"
              placeholder="Pseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-black placeholder-gray-400"
            />

            <button
              onClick={handleCreateProfile}
              className="w-full bg-black text-white rounded-lg px-3 py-2 mb-3"
            >
              Set username
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white rounded-lg px-2 py-1 text-xs w-full sm:w-auto"
            >
              Log off
            </button>
          </div>
        ) : user ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500 m-0 leading-tight">
              Connected : <strong>{profile?.username || user.email}</strong>
            </p>
            <p className="text-xs text-gray-500 m-0 leading-tight">
              Contributions : {contributionsCount}
            </p>

            <p className="text-xs text-gray-500 m-0 leading-tight">
              {category.toUpperCase()} | zoom {zoomLevel}
            </p>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white rounded-lg px-2 py-1 text-xs w-full sm:w-auto"
            >
              Log off
            </button>
          </div>
        ) : (
          <div>
            <h2 className="font-bold text-base sm:text-lg mb-3 text-black">
              {authMode === "signin" ? "Log in" : "Create account"}
            </h2>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text:sm text-black placeholder-gray-400"
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text:sm text-black placeholder-gray-400"
            />

            <div className="flex flex-col gap-2">
              <button
                onClick={authMode === "signin" ? handleLogin : handleSignUp}
                className="w-full bg-black text-white rounded-lg px-3 py-2 text-sm"
              >
                {authMode === "signin" ? "Log in" : "Create account"}
              </button>

              {authMode === "signin" && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-sm underline text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </button>
              )}

              <div className="mt-3 text-sm text-center">
                {authMode === "signin" ? (
                  <>
                    No account yet?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="underline text-blue-600 hover:text-blue-800"
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="underline text-blue-600 hover:text-blue-800"
                    >
                      Log in
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        )}

        {fullscreenImageUrl && (
          <div
            className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4"
            onClick={() => {
              setFullscreenImageUrl(null);
              setFullscreenImageAlt("");
            }}
          >
            <div className="relative max-w-full max-h-full">
              <img
                src={fullscreenImageUrl}
                alt={fullscreenImageAlt}
                className="max-w-[95vw] max-h-[85vh] rounded-xl bg-white"
                onClick={(e) => e.stopPropagation()}
              />

              <button
                onClick={() => {
                  setFullscreenImageUrl(null);
                  setFullscreenImageAlt("");
                }}
                className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
 );
}