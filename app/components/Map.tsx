"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { supabase } from "@/lib/supabase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import AddSpotForm from "./AddSpotForm";

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

type FakePoint = {
  id: number;
  type: "water" | "charge";
  position: [number, number];
  name: string;
};

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
      if (isPopupOpenRef.current) return;

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

function stopPopupPropagation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function CloseSpotCardOnMapClick({
  setSelectedSpot,
  ignoreNextMapClickRef,
}: {
  setSelectedSpot: (spot: Spot | null) => void;
  ignoreNextMapClickRef: { current: boolean };
}) {
  useMapEvents({
    click: () => {
      if (ignoreNextMapClickRef.current) {
        ignoreNextMapClickRef.current = false;
        return;
      }

      setSelectedSpot(null);
    },
  });

  return null;
}

export default function Map() {
  const mapRef = useRef<L.Map | null>(null);

  const [category, setCategory] = useState<string>("atm");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<PendingPosition>(null);
  const [newSpotName, setNewSpotName] = useState("");
  const [newSpotType, setNewSpotType] = useState("water");
  const [newSpotDescription, setNewSpotDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [contributionsCount, setContributionsCount] = useState(0);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [bounds, setBounds] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(6)
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const isPopupOpenRef = useRef(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const ignoreNextMapClickRef = useRef(false);
  
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

  const fakePoints: FakePoint[] = [
    {
      id: 1,
      type: "water",
      position: [48.8606, 2.3376],
      name: "Fontaine Louvre",
    },
    {
      id: 2,
      type: "charge",
      position: [48.853, 2.3499],
      name: "Recharge Café",
    },
  ];

useEffect(() => {
  const fetchSpots = async () => {
    if (!bounds) return;

    console.log("CATEGORY:", category);
    console.log("BOUNDS:", bounds);

    if ((category === "atm" || category === "wc") && zoomLevel < 11) {
      setSpots([]);
      return;
    }

    const { data, error } = await supabase
      .from("spots")
      .select("*")
      .eq("type", category)
      .gte("lat", bounds.south)
      .lte("lat", bounds.north)
      .gte("lng", bounds.west)
      .lte("lng", bounds.east)
      .order("id", { ascending: true })
      .limit(2000);

    console.log("MAIN QUERY COUNT:", data?.length);

    if (error) {
      console.error("Erreur Supabase spots:", error);
      return;
    }

    setSpots((data as Spot[]) || []);
  };

  const timeout = setTimeout(() => {
    fetchSpots();
  }, 250);

  return () => clearTimeout(timeout);
}, [bounds, category, zoomLevel]);

  useEffect(() => {
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
    { enableHighAccuracy: true }
  );
}, []);

  useEffect(() => {
    if (!userPosition || !mapRef.current || hasCenteredOnUser) return;

    mapRef.current.setView([userPosition.lat, userPosition.lng], 16);
    setHasCenteredOnUser(true);
  }, [userPosition, hasCenteredOnUser]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Aucun profil pour l'instant ou erreur:", error.message);
        setProfile(null);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
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
    setNewSpotName("");
    setNewSpotType("water");
    setNewSpotDescription("");
    setSelectedFile(null);
    setIsSelectingLocation(false);
    setShowAddForm(false);
 };

  const recenterOnUser = () => {
    if (!userPosition || !mapRef.current) return;
    mapRef.current.setView([userPosition.lat, userPosition.lng], 16);
  };

  const handleSaveSpot = async (
    name: string,
    type: string,
    description: string,
    file: File | null
  ) => {
    if (!pendingPosition) {
      alert("Choisis un emplacement.");
      return;
    }

    let photoUrl = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("spot-photos")
        .upload(`uploads/${fileName}`, file);

      if (error) {
        console.error("Erreur upload photo:", error);
        alert("Erreur upload photo");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("spot-photos")
        .getPublicUrl(`uploads/${fileName}`);

      photoUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("spots")
      .insert([
        {
          name: name.trim(),
          type: type,
          lat: pendingPosition.lat,
          lng: pendingPosition.lng,
          description: description.trim() || null,
          user_id: user?.id || null,
          photo_url: photoUrl,
          source: "user",
          country: null,
        },
      ])
      .select();

    setIsSaving(false);

    if (error) {
      console.error("Erreur insertion spot:", error);
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setSpots((prev) => [...prev, data[0] as Spot]);
    }

    resetAddForm();
    alert("Spot ajouté avec succès.");
  };

  const handleAddAtMyPosition = () => {
    if (!userPosition) {
      alert("Position non encore disponible.");
      return;
    }

    setIsSelectingLocation(false);
    setPendingPosition({
      lat: userPosition.lat,
      lng: userPosition.lng,
    });
    setShowAddForm(true);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Email et mot de passe requis");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);
      alert("Compte créé. Vérifie ton email si nécessaire.");
    }
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
      alert("Connecté.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    alert("Déconnecté.");
  };

  const handleCreateProfile = async () => {
    if (!user || !username.trim()) {
      alert("Pseudo requis");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          username: username.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erreur create profile:", error);
      alert(error.message);
      return;
    }

    setProfile(data as Profile);
    alert("Pseudo créé !");
  };

  const handleDeleteSpot = async (spotId: number) => {
    const confirmed = window.confirm("Supprimer ce spot ?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("spots")
      .delete()
      .eq("id", spotId);

    if (error) {
      console.error("Erreur suppression spot:", error);
      alert(error.message);
      return;
    }

    setSpots((prev) => prev.filter((spot) => spot.id !== spotId));
    alert("Spot supprimé.");
  };

  const getMarkerIcon = (type: string) => {
    let icon = "📍";
    let color = "#3b82f6";

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

    return L.divIcon({
      html: `
        <div style="
          background:${color};
          width:32px;
          height:32px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:16px;
          box-shadow:0 0 0 2px white;
        ">
          ${icon}
        </div>
      `,
      className: "",
      iconSize: [32, 32],
    });
  };

  const categories = [
    { value: "atm", label: "ATM", icon: "💳" },
    { value: "wc", label: "WC", icon: "🚻" },
    { value: "water", label: "Eau", icon: "🚰" },
    { value: "charge", label: "Charge", icon: "🔌" },
  ];

  return (
    <div className="h-screen w-full relative">
      <MapContainer
        center={[46.603354, 1.888334]}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater setBounds={setBounds} isPopupOpenRef={isPopupOpenRef} />

        <MapZoomUpdater setZoomLevel={setZoomLevel} />

        <AddSpotMapClick
          isSelectingLocation={isSelectingLocation}
          setPendingPosition={setPendingPosition}
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

        <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={35}
        disableClusteringAtZoom={16}
        spiderfyOnMaxZoom={true}
        zoomToBoundsOnClick={true}
        showCoverageOnHover={false}
        spiderfyDistanceMultiplier={2}
        >
        {spots
          .filter((spot) => matchesCategory(spot.type))
          .map((spot) => (
            <Marker
              key={`spot-${spot.id}`}
              position={[spot.lat, spot.lng]}
              icon={getMarkerIcon(spot.type)}
              eventHandlers={{
                click: () => {
                  ignoreNextMapClickRef.current = true;
                  setSelectedSpot(spot);
                },
              }}
            >
            </Marker>
          ))}
      </MarkerClusterGroup>

        {fakePoints
          .filter((point) => point.type === category)
          .map((point) => (
            <Marker key={point.id} position={point.position} icon={getMarkerIcon(point.type)}>
              <Popup>
                <div>
                  <strong>{point.name}</strong>
                  <br />
                  {point.type}
                </div>
              </Popup>
            </Marker>
          ))}

        {pendingPosition && (
          <Marker position={[pendingPosition.lat, pendingPosition.lng]}>
            <Popup>Nouvel emplacement sélectionné</Popup>
          </Marker>
        )}
      </MapContainer>

      {selectedSpot && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-24 z-[1200] w-[92%] max-w-md bg-white rounded-2xl shadow-2xl p-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start gap-3">
            <div>
              <h3 className="text-lg font-bold">FICHE CUSTOM - {selectedSpot.name}</h3>
              <p className="text-sm text-gray-600">{selectedSpot.type}</p>
            </div>

            <button
              onClick={() => setSelectedSpot(null)}
              className="text-gray-500 text-xl leading-none"
            >
              ×
            </button>
          </div>

          {selectedSpot.description && (
            <p className="mt-3 text-sm text-gray-800">{selectedSpot.description}</p>
          )}

          {selectedSpot.user_id && profilesMap[selectedSpot.user_id] && (
            <div className="mt-3 text-sm">
              Ajouté par : {profilesMap[selectedSpot.user_id]}
            </div>
          )}

          {selectedSpot.created_at && (
            <span className="text-xs text-gray-500 block mt-1">
              {new Date(selectedSpot.created_at).toLocaleDateString("fr-FR")}
            </span>
          )}

          {selectedSpot.photo_url && (
            <img
              src={selectedSpot.photo_url}
              alt={selectedSpot.name}
              className="mt-3 rounded-xl w-full max-h-52 object-cover"
            />
          )}

          {user && selectedSpot.user_id === user.id && (
            <button
              onClick={() => {
                handleDeleteSpot(selectedSpot.id);
                setSelectedSpot(null);
              }}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-xl"
            >
              Supprimer
            </button>
          )}
        </div>
      )}

      {(category === "atm" || category === "wc") && zoomLevel < 11 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-lg rounded-full px-4 py-2 text-sm pointer-events-none">
          Zoome davantage pour afficher les {category === "atm" ? "ATM" : "WC"}
        </div>
      )}

      <div className="absolute bottom-4 left-16 z-[1000] pointer-events-auto">
        <button
          onClick={() => setShowFiltersPanel((prev) => !prev)}
          className="bg-white shadow-lg rounded-full px-4 py-2 text-sm"
        >
          Filtres
        </button>
      </div>

      <div className="absolute bottom-4 left-36 z-[1000] pointer-events-none">
        <div className="bg-black text-white rounded-full px-4 py-2 text-sm shadow-lg">
          {categories.find((c) => c.value === category)?.label}
        </div>
      </div>

      {showFiltersPanel && (
       <div className="absolute bottom-20 left-4 z-[1000] bg-white shadow-xl rounded-2xl p-3 w-52 pointer-events-auto flex flex-col gap-2">
        {categories.map((cat) => (
         <button
         key={cat.value}
         onClick={() => {
          setCategory(cat.value);
          setShowFiltersPanel(false);
         }}
         className={`text-left px-3 py-2 rounded-xl ${
          category === cat.value ? "bg-black text-white" : "bg-gray-100"
         }`}
        >
          {cat.icon} {cat.label}
         </button>
        ))}
       </div>
      )}

      <div className="absolute top-4 right-4 z-[1000] pointer-events-auto flex flex-col gap-2">
        <button
          onClick={() => {
            if (isSelectingLocation || showAddForm) {
              resetAddForm();
            } else {
              setIsSelectingLocation(true);
              setShowAddForm(false);
              setPendingPosition(null);
           }
          }}
          className="bg-black text-white px-4 py-2 rounded-full shadow-lg"
        >
          {isSelectingLocation || showAddForm ? "Annuler" : "Ajouter un spot"}
          </button>

        <button
          onClick={handleAddAtMyPosition}
          className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg"
        >
          Ajouter à ma position
        </button>

        <button
          onClick={recenterOnUser}
          className="bg-white text-black px-4 py-2 rounded-full shadow-lg border"
        >
          📍 Recentrer sur moi
        </button>
      </div>

      {isSelectingLocation && !showAddForm && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-lg rounded-full px-4 py-2 text-sm pointer-events-auto">
          Clique sur la carte pour choisir l’emplacement
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
           ✓ Valider l’emplacement
          </button>
        </div>
      )}

      <AddSpotForm
        showAddForm={showAddForm}
        isSaving={isSaving}
        handleSaveSpot={handleSaveSpot}
        resetAddForm={resetAddForm}
      />

      <div className="absolute top-4 left-4 z-[1000] bg-white shadow-xl rounded-2xl p-2 sm:p-4 w-[155px] sm:w-[220px] pointer-events-auto">
        {user && !profile ? (
          <div>
            <h2 className="font-bold text-lg mb-3">Choisis ton pseudo</h2>

            <input
              type="text"
              placeholder="Pseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            <button
              onClick={handleCreateProfile}
              className="w-full bg-black text-white rounded-lg px-3 py-2 mb-3"
            >
              Valider pseudo
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white rounded-lg px-2 py-1 text-xs w-full sm:w-auto"
            >
              Se déconnecter
            </button>
          </div>
        ) : user ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs sm:text-sm m-0 leading-tight">
              Connecté : <strong>{profile?.username || user.email}</strong>
            </p>
            <p className="text-xs text-gray-500 m-0 leading-tight">
              Contributions : {contributionsCount}
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white rounded-lg px-2 py-1 text-xs w-full sm:w-auto"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          <div>
            <h2 className="font-bold text-lg mb-3">Connexion</h2>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSignUp}
                className="flex-1 bg-black text-white rounded-lg px-3 py-2"
              >
                Créer compte
              </button>

              <button
                onClick={handleLogin}
                className="flex-1 bg-blue-600 text-white rounded-lg px-3 py-2"
              >
                Connexion
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
 );
}