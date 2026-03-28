"use client";

import { useEffect, useRef, useState } from "react";
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
  isAdding,
  setPendingPosition,
}: {
  isAdding: boolean;
  setPendingPosition: (pos: PendingPosition) => void;
}) {
  useMapEvents({
    click(e) {
      if (!isAdding) return;
      setPendingPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

export default function Map() {
  const mapRef = useRef<L.Map | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [atmData, setAtmData] = useState<any>(null);
  const [wcData, setWcData] = useState<any>(null);
  const [spots, setSpots] = useState<Spot[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<PendingPosition>(null);
  const [newSpotName, setNewSpotName] = useState("");
  const [newSpotType, setNewSpotType] = useState("water");
  const [newSpotDescription, setNewSpotDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    fetch("/atm.geojson")
      .then((res) => res.json())
      .then((data) => setAtmData(data))
      .catch((err) => console.error("Erreur chargement ATM:", err));

    fetch("/wc.geojson")
      .then((res) => res.json())
      .then((data) => setWcData(data))
      .catch((err) => console.error("Erreur chargement WC:", err));

    const fetchSpots = async () => {
      const { data, error } = await supabase.from("spots").select("*");

      if (error) {
        console.error("Erreur Supabase spots:", error);
      } else {
        setSpots((data as Spot[]) || []);
      }
    };

    fetchSpots();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.log("Erreur GPS", error);
      },
      {
        enableHighAccuracy: true,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
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

  const showAll = category === null;

  const matchesCategory = (spotType: string) => {
    if (showAll) return true;
    if (category === "water" && spotType === "water") return true;
    if (category === "charge" && spotType === "charge") return true;
    return spotType === category;
  };

  const resetAddForm = () => {
    setPendingPosition(null);
    setNewSpotName("");
    setNewSpotType("water");
    setNewSpotDescription("");
    setIsAdding(false);
  };

  const recenterOnUser = () => {
    if (!userPosition || !mapRef.current) return;
    mapRef.current.setView([userPosition.lat, userPosition.lng], 16);
  };

  const handleSaveSpot = async () => {
    if (!pendingPosition) {
      alert("Choisis un emplacement.");
      return;
    }

    let photoUrl = null;

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("spot-photos")
        .upload(`uploads/${fileName}`, selectedFile);

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
          name: newSpotName.trim(),
          type: newSpotType,
          lat: pendingPosition.lat,
          lng: pendingPosition.lng,
          description: newSpotDescription.trim() || null,
          user_id: user?.id || null,
          photo_url: photoUrl,
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

    setIsAdding(true);
    setPendingPosition({
      lat: userPosition.lat,
      lng: userPosition.lng,
    });
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

        <AddSpotMapClick
          isAdding={isAdding}
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

        {spots
          .filter((spot) => matchesCategory(spot.type))
          .map((spot) => (
            <Marker key={`spot-${spot.id}`} position={[spot.lat, spot.lng]} icon={getMarkerIcon(spot.type)} >
              <Popup>
                <div>
                  <strong>{spot.name}</strong>
                  <br />
                  {spot.type}
                  <br />
                  {spot.description}
                  {spot.user_id && profilesMap[spot.user_id] && (
                    <>                      
                      <br />
                      Ajouté par : {profilesMap[spot.user_id]}
                    </>
                  )}
                  {spot.photo_url && (
                    <>
                      <br />
                      <img
                        src={spot.photo_url}
                        alt={spot.name}
                        className="mt-2 rounded-lg w-full max-h-40 object-cover"
                      />
                    </>
                  )}

                  {user && spot.user_id === user.id && (
                    <>
                      <br />
                      <button
                        onClick={() => handleDeleteSpot(spot.id)}
                        className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {(showAll || category === "atm") &&
          atmData &&
          atmData.features.slice(0, 100).map((feature: any, index: number) => {
            const coords = feature?.geometry?.coordinates;
            if (!coords || coords.length < 2) return null;

            return (
              <Marker key={`atm-${index}`} position={[coords[1], coords[0]]} icon={getMarkerIcon("atm")}>
                <Popup>
                  <div>
                    <strong>{feature.properties?.name || "ATM"}</strong>
                    <br />
                    {feature.properties?.operator ||
                      feature.properties?.enseigne ||
                      ""}
                    <br />
                    {feature.properties?.city ||
                      feature.properties?.commune ||
                      ""}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {(showAll || category === "wc") &&
          wcData &&
          wcData.features.slice(0, 100).map((feature: any, index: number) => {
            const coords = feature?.geometry?.coordinates;
            if (!coords || coords.length < 2) return null;

            return (
              <Marker key={`wc-${index}`} position={[coords[1], coords[0]]} icon={getMarkerIcon("wc")} >
                <Popup>
                  <div>
                    <strong>
                      {feature.properties?.nom ||
                        feature.properties?.name ||
                        "WC public"}
                    </strong>
                    <br />
                    {feature.properties?.adresse ||
                      feature.properties?.address ||
                      ""}
                    <br />
                    {feature.properties?.arrondissement || "Paris"}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {fakePoints
          .filter((point) => showAll || point.type === category)
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

      <div className="absolute top-4 right-4 z-[1000] pointer-events-auto flex flex-col gap-2">
        <button
          onClick={() => {
            if (isAdding) {
              resetAddForm();
            } else {
              setIsAdding(true);
            }
          }}
          className="bg-black text-white px-4 py-2 rounded-full shadow-lg"
        >
          {isAdding ? "Annuler" : "Ajouter un spot"}
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

      {isAdding && (
        <div className="absolute top-36 right-4 z-[1000] bg-white shadow-xl rounded-2xl p-4 w-80 pointer-events-auto">
          <h2 className="font-bold text-lg mb-2">Nouveau spot</h2>

          <p className="text-sm text-gray-600 mb-3">
            Clique sur la carte ou utilise “Ajouter à ma position”.
          </p>

          {pendingPosition && (
            <p className="text-xs text-gray-500 mb-3">
              Lat: {pendingPosition.lat.toFixed(5)} | Lng:{" "}
              {pendingPosition.lng.toFixed(5)}
            </p>
          )}

          <input
            type="text"
            placeholder="Nom du spot"
            value={newSpotName}
            onChange={(e) => setNewSpotName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3"
          />

          <select
            value={newSpotType}
            onChange={(e) => setNewSpotType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3"
          >
            <option value="water">Eau potable / refill</option>
            <option value="charge">Recharge</option>
            <option value="wc">WC</option>
            <option value="atm">ATM</option>
          </select>

          <label className="w-full cursor-pointer bg-gray-100 hover:bg-gray-200 border rounded-lg px-3 py-2 mb-3 block text-center">
            📷 Ajouter / prendre une photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="w-full rounded-lg mt-2 mb-3 max-h-40 object-cover"
            />
          )}

          <textarea
            placeholder="Description"
            value={newSpotDescription}
            onChange={(e) => setNewSpotDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3"
            rows={3}
          />

          <button
            onClick={handleSaveSpot}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white rounded-lg px-3 py-2"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer le spot"}
          </button>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] bg-white shadow-xl rounded-2xl p-4 w-80 pointer-events-auto">
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
              className="w-full sm:w-auto bg-red-500 text-white rounded-lg px-3 py-2 text-sm"
            >
              Se déconnecter
            </button>
          </div>
        ) : user ? (
          <div>
            <p className="text-xs sm:text-sm mb-1">
              Connecté : <strong>{profile?.username || user.email}</strong>
            </p>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-red-500 text-white rounded-lg px-3 py-2 text-sm"
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

      <div className="absolute inset-0 z-[1000] pointer-events-none">
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 
                     bg-white shadow-lg rounded-full px-4 py-2 flex gap-3
                     pointer-events-auto"
        >
          <button
            onClick={() => setCategory("atm")}
            className={`px-3 py-1 rounded-full ${
              category === "atm" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            💳 ATM
          </button>

          <button
            onClick={() => setCategory("wc")}
            className={`px-3 py-1 rounded-full ${
              category === "wc" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            🚻 WC
          </button>

          <button
            onClick={() => setCategory("water")}
            className={`px-3 py-1 rounded-full ${
              category === "water" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            🚰 Eau
          </button>

          <button
            onClick={() => setCategory("charge")}
            className={`px-3 py-1 rounded-full ${
              category === "charge" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            🔌 Charge
          </button>

          <button
            onClick={() => setCategory(null)}
            className={`px-3 py-1 rounded-full ${
              category === null ? "bg-black text-white" : "bg-gray-200"
            }`}
          >
            Tout
          </button>
        </div>
      </div>
    </div>
  );
}