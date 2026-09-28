"use client";

import { ReactNode } from "react";

type EventType = "google_maps" | "website" | "instagram" | "phone";

type TrackedOutboundLinkProps = {
  href: string;
  spotId: number;
  eventType: EventType;
  className?: string;
  children: ReactNode;
};

export default function TrackedOutboundLink({
  href,
  spotId,
  eventType,
  className,
  children,
}: TrackedOutboundLinkProps) {
  function trackClick() {
    fetch("/api/outbound-click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spot_id: spotId,
        event_type: eventType,
      }),
      keepalive: true,
    }).catch(() => {
      // Never block the visitor if tracking fails
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={trackClick}
    >
      {children}
    </a>
  );
}