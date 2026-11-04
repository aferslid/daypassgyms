"use client";

import { useState } from "react";

type SubmissionType = "new" | "update";

type Props = {
  initialGymName?: string;
  initialType?: SubmissionType;
  initialCity?: string;
  initialCountry?: string;
  initialSpotId?: number | null;
  initialIsOwner?: boolean;
};

const inputClass =
  "w-full rounded-[12px] border border-[#EBEBEB] bg-white p-4 text-[14px] outline-none transition focus:border-[#B8D92C]";

function SectionTitle({
  children,
  description,
}: {
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="pt-4">
      <h2 className="text-[20px] font-extrabold text-[#0C0C0C]">
        {children}
      </h2>

      {description && (
        <p className="mt-1 text-[13px] leading-5 text-[#888]">
          {description}
        </p>
      )}
    </div>
  );
}

export default function SuggestForm({
  initialGymName = "",
  initialType = "new",
  initialCity = "",
  initialCountry = "",
  initialSpotId = null,
  initialIsOwner = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOwner, setIsOwner] = useState(initialIsOwner);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    setLoading(true);
    setSuccess(false);
    setErrorMessage("");

    const formData = new FormData(form);

    const freeTrialValue = String(
      formData.get("free_trial") || ""
    );

    const payload = {
      spot_id: initialSpotId,

      submission_type: String(
        formData.get("submission_type") || "new"
      ),

      submitter_is_owner:
        formData.get("submitter_is_owner") === "on",

      contact_name: String(
        formData.get("contact_name") || ""
      ).trim(),

      contact_role: String(
        formData.get("contact_role") || ""
      ).trim(),

      gym_name: String(formData.get("gym_name") || "").trim(),
      gym_type: String(formData.get("gym_type") || "").trim(),

      city: String(formData.get("city") || "").trim(),
      country: String(formData.get("country") || "").trim(),
      address: String(formData.get("address") || "").trim(),

      website_url: String(
        formData.get("website_url") || ""
      ).trim(),

      instagram_url: String(
        formData.get("instagram_url") || ""
      ).trim(),

      google_maps_url: String(
        formData.get("google_maps_url") || ""
      ).trim(),

      phone: String(formData.get("phone") || "").trim(),
      gym_email: String(formData.get("gym_email") || "").trim(),

      day_pass_price: String(
        formData.get("day_pass_price") || ""
      ).trim(),

      currency: String(formData.get("currency") || "").trim(),

      week_pass_price: String(
        formData.get("week_pass_price") || ""
      ).trim(),

      day_pass_note: String(
        formData.get("day_pass_note") || ""
      ).trim(),

      free_trial:
        freeTrialValue === "yes"
          ? true
          : freeTrialValue === "no"
          ? false
          : null,

      free_trial_duration: String(
        formData.get("free_trial_duration") || ""
      ).trim(),

      shower: String(formData.get("shower") || "").trim(),
      locker: String(formData.get("locker") || "").trim(),
      wifi: String(formData.get("wifi") || "").trim(),
      pool: String(formData.get("pool") || "").trim(),

      access_gender: String(
        formData.get("access_gender") || ""
      ).trim(),

      opening_hours: String(
        formData.get("opening_hours") || ""
      ).trim(),

      notes: String(formData.get("notes") || "").trim(),

      contact_email: String(
        formData.get("contact_email") || ""
      ).trim(),
    };

    const response = await fetch("/api/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      setLoading(false);
      setErrorMessage(
        data.error ||
          "Something went wrong. Please try again."
      );

      return;
    }

    const photo = formData.get("photo");

    if (
      payload.submitter_is_owner &&
      photo instanceof File &&
      photo.size > 0
    ) {
      const photoFormData = new FormData();

      photoFormData.append(
        "suggestion_id",
        String(data.suggestion_id)
      );

      photoFormData.append(
        "photo",
        photo
      );

      const photoResponse = await fetch(
        "/api/suggest/photo",
        {
          method: "POST",
          body: photoFormData,
        }
      );

      if (!photoResponse.ok) {
        const photoError = await photoResponse.json();

        setLoading(false);
        setSuccess(true);

        setErrorMessage(
          `The listing information was submitted, but the photo could not be uploaded: ${
            photoError.error || "Unknown error"
          }`
        );

        form.reset();
        return;
      }
    }

    setLoading(false);
    setSuccess(true);
    setErrorMessage("");
    form.reset();
      }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-[13px] font-bold text-[#555]">
          What would you like to do?
        </label>

        <select
          name="submission_type"
          defaultValue={initialType}
          className={inputClass}
        >
          <option value="new">Add a new gym</option>
          <option value="update">Update an existing gym</option>
        </select>

        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[12px] border border-[#EBEBEB] bg-[#F7F7F5] p-4">
          <input
            type="checkbox"
            name="submitter_is_owner"
            checked={isOwner}
            onChange={(event) => setIsOwner(event.target.checked)}
            className="mt-1 h-4 w-4"
          />

          <span>
            <span className="block text-[14px] font-bold text-[#0C0C0C]">
              I own or manage this gym
            </span>

            <span className="mt-1 block text-[12px] leading-5 text-[#777]">
              This helps us identify information submitted directly by the gym.
            </span>
          </span>
        </label>

        {isOwner && (
          <div className="grid gap-5 rounded-[12px] border border-[#DDE8A7] bg-[#F8FBEA] p-4 md:grid-cols-2">
            <input
              name="contact_name"
              required
              placeholder="Your name *"
              className={inputClass}
            />

            <input
              name="contact_role"
              required
              placeholder="Your role (owner, manager...) *"
              className={inputClass}
            />

            <div className="md:col-span-2">
              <p className="text-[12px] leading-5 text-[#667244]">
                Owner submissions are reviewed manually before any listing information is changed.
              </p>
            </div>
          </div>
        )}
      </div>

      <SectionTitle description="Basic information about the gym.">
        Gym information
      </SectionTitle>

      <input
        name="gym_name"
        required
        defaultValue={initialGymName}
        placeholder="Gym name *"
        className={inputClass}
      />

      <select name="gym_type" className={inputClass} defaultValue="">
        <option value="">Gym type</option>
        <option value="gym">Gym</option>
        <option value="crossfit">CrossFit</option>
        <option value="hyrox">HYROX</option>
        <option value="functional">Functional training</option>
        <option value="boxing">Boxing</option>
        <option value="martial_arts">Martial arts</option>
        <option value="yoga">Yoga</option>
        <option value="calisthenics">Calisthenics</option>
        <option value="pilates">Pilates</option>
        <option value="other">Other</option>
      </select>

      <div className="grid gap-5 md:grid-cols-2">
        <input
          name="city"
          defaultValue={initialCity}
          placeholder="City"
          className={inputClass}
        />

        <input
          name="country"
          defaultValue={initialCountry}
          placeholder="Country"
          className={inputClass}
        />
      </div>

      <input
        name="address"
        placeholder="Street address"
        className={inputClass}
      />

      <SectionTitle description="Official links and contact information.">
        Contact & links
      </SectionTitle>

      <input
        name="website_url"
        type="url"
        placeholder="Official website"
        className={inputClass}
      />

      <input
        name="instagram_url"
        placeholder="Instagram URL"
        className={inputClass}
      />

      <input
        name="google_maps_url"
        placeholder="Google Maps URL"
        className={inputClass}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <input
          name="phone"
          placeholder="Gym phone number"
          className={inputClass}
        />

        <input
          name="gym_email"
          type="email"
          placeholder="Gym email"
          className={inputClass}
        />
      </div>

      <SectionTitle description="Leave fields blank if you do not know the current price.">
        Passes & pricing
      </SectionTitle>

      <div className="grid gap-5 md:grid-cols-2">
        <input
          name="day_pass_price"
          placeholder="Day pass price"
          className={inputClass}
        />

        <input
          name="currency"
          placeholder="Currency (USD, EUR, GBP...)"
          className={inputClass}
        />
      </div>

      <input
        name="week_pass_price"
        placeholder="Week pass price"
        className={inputClass}
      />

      <input
        name="day_pass_note"
        placeholder="Price/access note (e.g. valid for 24 hours)"
        className={inputClass}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <select
          name="free_trial"
          className={inputClass}
          defaultValue=""
        >
          <option value="">Free trial?</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>

        <input
          name="free_trial_duration"
          placeholder="Free trial duration"
          className={inputClass}
        />
      </div>

      <SectionTitle description="Choose Unknown rather than guessing.">
        Facilities
      </SectionTitle>

      <div className="grid gap-5 md:grid-cols-2">
        <select name="shower" defaultValue="" className={inputClass}>
          <option value="">Shower</option>
          <option value="yes">Available</option>
          <option value="no">Not available</option>
          <option value="unknown">Unknown</option>
        </select>

        <select name="locker" defaultValue="" className={inputClass}>
          <option value="">Locker</option>
          <option value="yes">Available</option>
          <option value="no">Not available</option>
          <option value="unknown">Unknown</option>
        </select>

        <select name="wifi" defaultValue="" className={inputClass}>
          <option value="">Wi-Fi</option>
          <option value="yes">Available</option>
          <option value="no">Not available</option>
          <option value="unknown">Unknown</option>
        </select>

        <select name="pool" defaultValue="" className={inputClass}>
          <option value="">Pool</option>
          <option value="yes">Available</option>
          <option value="no">Not available</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      <SectionTitle>
        Access & opening hours
      </SectionTitle>

      <select
        name="access_gender"
        defaultValue=""
        className={inputClass}
      >
        <option value="">Gender/access policy</option>
        <option value="mixed">Mixed</option>
        <option value="men">Men only</option>
        <option value="women">Women only</option>
        <option value="unknown">Unknown</option>
      </select>

      <textarea
        name="opening_hours"
        placeholder="Opening hours / schedule"
        className="h-28 w-full rounded-[12px] border border-[#EBEBEB] p-4 text-[14px]"
      />

      {isOwner && (
        <>
          <SectionTitle description="Optional. Send an official or representative photo of the gym. Photos are reviewed before publication.">
            Gym photo
          </SectionTitle>

          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className={inputClass}
          />

          <p className="-mt-3 text-[12px] leading-5 text-[#999]">
            JPG, PNG or WebP. Maximum 5 MB.
          </p>
        </>
      )}

      <SectionTitle>
        Anything else?
      </SectionTitle>

      <textarea
        name="notes"
        placeholder="Corrections, extra information, special access conditions..."
        className="h-32 w-full rounded-[12px] border border-[#EBEBEB] p-4 text-[14px]"
      />

      <div className="border-t border-[#EBEBEB] pt-6">
        <label className="mb-2 block text-[13px] font-bold text-[#555]">
          Your email
        </label>

        <input
          name="contact_email"
          type="email"
          required={isOwner}
          placeholder={
            isOwner
              ? "Your business email *"
              : "Your email (optional)"
          }
          className={inputClass}
        />

        <p className="mt-2 text-[12px] leading-5 text-[#999]">
          {isOwner
            ? "Required so we can verify the submission with the gym if needed."
            : "Used only if we need to verify or clarify your submission."}
        </p>
      </div>

      <button
        disabled={loading}
        className="rounded-[10px] bg-[#C8F135] px-6 py-3 font-bold text-[#0C0C0C] transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit information"}
      </button>

      {success && (
        <p className="text-sm font-bold text-green-700">
          Thanks — your information has been submitted for review.
        </p>
      )}

      {errorMessage && (
        <p className="text-sm font-bold text-red-600">
          {errorMessage}
        </p>
      )}
    </form>
  );
}