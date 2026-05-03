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
    file: File | null,
    details: Record<string, any>
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
  const [details, setDetails] = useState<Record<string, any>>({});
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const renderYesNoField = (
    label: string,
    keyName: string
  ) => (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        value={details[keyName] ?? ""}
        onChange={(e) =>
          setDetails((prev) => ({
            ...prev,
            [keyName]:
              e.target.value === ""
                ? undefined
                : e.target.value,
          }))
        }
        className="w-full border rounded-xl px-4 py-3"
      >
        <option value="">Select</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );

  if (!showAddForm) return null;

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setIsProcessingImage(true);

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
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-20 z-[1000] bg-white shadow-xl rounded-2xl p-4 w-[90%] max-w-md max-h-[70vh] overflow-y-auto pointer-events-auto">
      <h2 className="text-xl font-bold mb-2">New spot</h2>
      <p className="text-sm text-gray-600 mb-4">
        Fill in the details for this spot.
      </p>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Spot name"
          value={newSpotName}
          onChange={(e) => setNewSpotName(e.target.value)}
          className={`w-full border rounded-xl px-4 py-3 ${
            !newSpotName.trim() ? "border-red-500" : ""
          }`}
        />

        <p className="text-red-500 text-sm h-5 mt-1">
          {!newSpotName.trim() ? "Name is required" : ""}
        </p>
      </div>

      <select
        value={newSpotType}
        onChange={(e) => {
          const newType = e.target.value;
          setNewSpotType(newType);
          setDetails({});
        }}
        className="w-full border rounded-xl px-4 py-3 mb-3 max-h-40 overflow-y-auto"
      >

        <option value="atm">ATM</option>
        <option value="wc">WC</option>
        <option value="water">Water</option>
        <option value="charge">Charge</option>
        <option value="rest">Rest</option>
        <option value="coffee">Coffee</option>
        <option value="luggage">Luggage</option>
        <option value="wifi">WiFi</option>
        <option value="mailbox">Mailbox</option>
        <option value="tourist_info">Info Center</option>
        <option value="viewpoint">Viewpoint</option>
        <option value="gym">Gym</option>
        <option value="street_workout">Street workout</option>
        <option value="coworking">Coworking</option>
        <option value="healthy_food">Healthy food</option>
        <option value="sim">SIM</option>
        <option value="cheap_food">Cheap food</option>
        <option value="activity">Activity</option>
        <option value="tattoo">Tattoo</option>
        <option value="barber">Barber</option>
        <option value="laundry">Laundry</option>
        <option value="shower">Shower</option>
        <option value="tent_spot">Tent spot</option>
      </select>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="border rounded-xl px-4 py-3 text-center"
        >
          📷 Take photo
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="border rounded-xl px-4 py-3 text-center"
        >
          🖼️ Gallery
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

      {newSpotType === "atm" && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ATM fees</label>
            <input
              type="number"
              step="0.01"
              placeholder="Example: 3"
              value={details.fee_value ?? ""}
              onChange={(e) =>
                setDetails((prev) => ({
                  ...prev,
                  fee_value:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Fee type</label>
            <select
              value={details.fee_type ?? ""}
              onChange={(e) =>
                setDetails((prev) => ({
                  ...prev,
                  fee_type: e.target.value || undefined,
                }))
              }
              className="w-full border rounded-xl px-4 py-3"
            >
              <option value="">Select</option>
              <option value="currency">Currency</option>
              <option value="percent">Percent</option>
            </select>
          </div>

          {details.fee_type === "currency" && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input
                type="text"
                placeholder="EUR, USD, GEL..."
                value={details.currency ?? ""}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    currency: e.target.value || undefined,
                  }))
                }
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ATM location</label>
            <select
              value={details.location_type ?? ""}
              onChange={(e) =>
                setDetails((prev) => ({
                  ...prev,
                  location_type: e.target.value || undefined,
                }))
              }
              className="w-full border rounded-xl px-4 py-3"
            >
              <option value="">Select</option>
              <option value="inside">Inside</option>
              <option value="outside">Outside</option>
            </select>
          </div>
        </>
      )}

      {newSpotType === "wc" && (
        <>
          {renderYesNoField("Free", "free")}
          {renderYesNoField("PMR access", "pmr")}
        </>
      )}

      {newSpotType === "water" && (
        <>
          {renderYesNoField("Drinkable", "drinkable")}
        </>
      )}

      {newSpotType === "charge" && (
        <>
          {renderYesNoField("Consumption required", "consumption_required")}
        </>
      )}

      {newSpotType === "wifi" && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">WiFi name</label>
            <input
              type="text"
              placeholder="Network name"
              value={details.network_name ?? ""}
              onChange={(e) =>
                setDetails((prev) => ({
                  ...prev,
                  network_name: e.target.value || undefined,
                }))
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="text"
              placeholder="WiFi password"
              value={details.password ?? ""}
              onChange={(e) =>
                setDetails((prev) => ({
                  ...prev,
                  password: e.target.value || undefined,
                }))
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>
        </>
      )}

      {newSpotType === "tent_spot" && (
        <div className="space-y-3 mb-3">
          <select
            value={details.campsite_type || ""}
            onChange={(e) =>
              setDetails({ ...details, campsite_type: e.target.value })
            }
            className="w-full border rounded-xl px-4 py-3"
          >
            <option value="">Campsite type</option>
            <option value="official">Official</option>
            <option value="tolerated">Tolerated</option>
          </select>

          <select
            value={details.free || ""}
            onChange={(e) =>
              setDetails({ ...details, free: e.target.value === "true" })
            }
            className="w-full border rounded-xl px-4 py-3"
          >
            <option value="">Free?</option>
            <option value="true">Free</option>
            <option value="false">Not free</option>
          </select>

          <select
            value={details.flat_ground || ""}
            onChange={(e) =>
              setDetails({ ...details, flat_ground: e.target.value === "true" })
            }
            className="w-full border rounded-xl px-4 py-3"
          >
            <option value="">Flat ground?</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>

          <select
            value={details.safe || ""}
            onChange={(e) =>
              setDetails({ ...details, safe: e.target.value })
            }
            className="w-full border rounded-xl px-4 py-3"
          >
            <option value="">Safe?</option>
            <option value="yes">Yes</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      )}

      {newSpotType === "gym" && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Day pass price</label>
            <input
              type="number"
              step="0.01"
              placeholder="Example: 10"
              value={details.day_pass_price ?? ""}
              onChange={(e) =>
                setDetails((prev) => ({
                  ...prev,
                  day_pass_price:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Currency</label>
            <input
              type="text"
              placeholder="EUR, USD, GEL..."
              value={details.currency ?? ""}
              onChange={(e) =>
                setDetails((prev) => ({
                  ...prev,
                  currency: e.target.value || undefined,
                }))
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          {renderYesNoField("Shower", "shower")}
        </>
      )}

      {newSpotType === "coworking" && (
        <>
          {renderYesNoField("Reservation required", "reservation_required")}
        </>
      )}

      <textarea
        placeholder={
          newSpotType === "tent_spot"
            ? "Describe the spot (flat ground, safety, rules...)"
            : "Description"
        }
        value={newSpotDescription}
        onChange={(e) => setNewSpotDescription(e.target.value)}
        className="w-full border rounded-xl px-4 py-3 mb-3 min-h-[120px]"
      />

      {newSpotType === "tent_spot" && !newSpotDescription.trim() && (
        <p className="text-xs text-red-500 mt-1">
          Description required for tent spots
        </p>
      )}

      <button
        onClick={() =>
          handleSaveSpot(
            newSpotName,
            newSpotType,
            newSpotDescription,
            selectedFile,
            Object.fromEntries(
              Object.entries(details).filter(([, value]) => value !== undefined)
            )
          )
        }
        disabled={
          isSaving ||
          isProcessingImage ||
          !newSpotName.trim() ||
          (newSpotType === "tent_spot" && !newSpotDescription.trim())
        }
        className={`w-full rounded-xl px-4 py-3 text-white ${
          isSaving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 active:scale-95"
        }`}
      >
        {isSaving ? "Saving..." : isProcessingImage ? "Processing image..." : "Save spot"}
      </button>
    </div>
  );
}