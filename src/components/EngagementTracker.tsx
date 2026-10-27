"use client";

import { useEffect } from "react";

export default function EngagementTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const storageKey = `proposal-session:${slug}`;
    let sessionId = sessionStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, sessionId);
    }

    const endpoint = `/api/events/${encodeURIComponent(slug)}`;
    const send = (eventType: "view" | "engagement", activeSeconds = 0) => {
      const body = JSON.stringify({ eventType, sessionId, activeSeconds });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      } else {
        void fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true,
        });
      }
    };

    send("view");
    let activeSeconds = 0;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") activeSeconds += 5;
      if (activeSeconds >= 15) {
        send("engagement", activeSeconds);
        activeSeconds = 0;
      }
    }, 5000);
    const flush = () => {
      if (activeSeconds > 0) send("engagement", activeSeconds);
      activeSeconds = 0;
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [slug]);

  return null;
}
