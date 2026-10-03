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

function getVisitorId() {
  const storageKey = "dpg_visitor_id";

  try {
    let visitorId = localStorage.getItem(storageKey);

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(storageKey, visitorId);
    }

    return visitorId;
  } catch {
    return null;
  }
}

export default function TrackedOutboundLink({
  href,
  spotId,
  eventType,
  className,
  children,
}: TrackedOutboundLinkProps) {
  function trackClick() {
    const visitorId = getVisitorId();

    fetch("/api/outbound-click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spot_id: spotId,
        event_type: eventType,
        visitor_id: visitorId,
      }),
      keepalive: true,
    }).catch(() => {
      // Never block the visitor if tracking fails
    });
  }

  const isPhoneLink = href.startsWith("tel:");

  return (
    <a
      href={href}
      target={isPhoneLink ? undefined : "_blank"}
      rel={isPhoneLink ? undefined : "noopener noreferrer"}
      className={className}
      onClick={trackClick}
    >
      {children}
    </a>
  );
}