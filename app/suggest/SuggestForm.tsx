"use client";

import { useState } from "react";

export default function SuggestForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setSuccess(false);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      gym_name: String(formData.get("gym_name") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      country: String(formData.get("country") || "").trim(),
      website_url: String(formData.get("website_url") || "").trim(),
      google_maps_url: String(formData.get("google_maps_url") || "").trim(),
      day_pass_price: String(formData.get("day_pass_price") || "").trim(),
      shower: String(formData.get("shower") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      contact_email: String(formData.get("contact_email") || "").trim(),
    };

    const response = await fetch("/api/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    });

    if (!response.ok) {
    const data = await response.json();
    setLoading(false);
    setErrorMessage(data.error || "Something went wrong. Please try again.");
    return;
    }

    setLoading(false);
    setSuccess(true);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input name="gym_name" required placeholder="Gym name *" className="w-full rounded-[12px] border border-[#EBEBEB] p-4" />
      <input name="city" placeholder="City" className="w-full rounded-[12px] border border-[#EBEBEB] p-4" />
      <input name="country" placeholder="Country" className="w-full rounded-[12px] border border-[#EBEBEB] p-4" />
      <input name="website_url" placeholder="Website or Instagram" className="w-full rounded-[12px] border border-[#EBEBEB] p-4" />
      <input name="google_maps_url" placeholder="Google Maps URL" className="w-full rounded-[12px] border border-[#EBEBEB] p-4" />
      <input name="day_pass_price" placeholder="Day pass price, if known" className="w-full rounded-[12px] border border-[#EBEBEB] p-4" />

      <select name="shower" className="w-full rounded-[12px] border border-[#EBEBEB] p-4">
        <option value="">Shower info</option>
        <option value="yes">Shower available</option>
        <option value="no">No shower</option>
        <option value="unknown">Unknown</option>
      </select>

      <textarea name="notes" placeholder="Extra information" className="h-36 w-full rounded-[12px] border border-[#EBEBEB] p-4" />
      <input name="contact_email" placeholder="Your email, optional" className="w-full rounded-[12px] border border-[#EBEBEB] p-4" />

      <button disabled={loading} className="rounded-[10px] bg-[#C8F135] px-6 py-3 font-bold text-[#0C0C0C]">
        {loading ? "Submitting..." : "Submit gym"}
      </button>

      {success && <p className="text-sm font-bold text-green-700">Thanks — suggestion submitted.</p>}
      {errorMessage && <p className="text-sm font-bold text-red-600">{errorMessage}</p>}
    </form>
  );
}