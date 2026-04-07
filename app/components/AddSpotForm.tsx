import { useRef, useState } from "react"
import imageCompression from "browser-image-compression";

type PendingPosition = {
  lat: number;
  lng: number;
} | null;

type AddSpotFormProps = {
  showAddForm: boolean;
  isSaving: boolean;
  handleSaveSpot: (
    name: string,
    type: string,
    description: string,
    file: File | null
  ) => void;
  resetAddForm: () => void;
};

export default function AddSpotForm({
  showAddForm,
  isSaving,
  handleSaveSpot,
  resetAddForm,
}: AddSpotFormProps) {
  const [newSpotName, setNewSpotName] = useState("");
  const [newSpotType, setNewSpotType] = useState("water");
  const [newSpotDescription, setNewSpotDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  if (!showAddForm) return null;

  const handleImageChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0] || null;
  if (!file) return;

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.75,
    });

    setSelectedFile(compressedFile);
  } catch (error) {
    console.error("Erreur compression image:", error);
    setSelectedFile(file);
  }
};

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-20 z-[1000] bg-white shadow-xl rounded-2xl p-4 w-[90%] max-w-md max-h-[70vh] overflow-y-auto pointer-events-auto">
      <h2 className="text-xl font-bold mb-2">Nouveau spot</h2>
      <p className="text-sm text-gray-600 mb-4">
        Clique sur la carte ou utilise “Ajouter à ma position”.
      </p>

      <input
        type="text"
        placeholder="Nom du spot"
        value={newSpotName}
        onChange={(e) => setNewSpotName(e.target.value)}
        className="w-full border rounded-xl px-4 py-3 mb-3"
      />

      <select
        value={newSpotType}
        onChange={(e) => setNewSpotType(e.target.value)}
        className="w-full border rounded-xl px-4 py-3 mb-3"
      >
        <option value="atm">ATM</option>
        <option value="wc">WC</option>
        <option value="water">Eau</option>
        <option value="charge">Charge</option>
        <option value="rest">Repos</option>
        <option value="coffee">Café</option>
        <option value="luggage">Bagage</option>
        <option value="wifi">WiFi</option>
        <option value="mailbox">Boîte</option>
      </select>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="border rounded-xl px-4 py-3 text-center"
        >
          📷 Prendre photo
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="border rounded-xl px-4 py-3 text-center"
        >
          🖼️ Galerie
        </button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageChange}
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

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
        className="w-full border rounded-xl px-4 py-3 mb-3 min-h-[120px]"
      />

      <button
        onClick={() =>
          handleSaveSpot(
            newSpotName,
            newSpotType,
            newSpotDescription,
            selectedFile
          )
        }
        disabled={isSaving || !newSpotName}
        className={`w-full rounded-xl px-4 py-3 text-white ${
          isSaving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 active:scale-95"
        }`}
      >
        {isSaving ? "Enregistrement..." : "Enregistrer le spot"}
      </button>
    </div>
  );
}