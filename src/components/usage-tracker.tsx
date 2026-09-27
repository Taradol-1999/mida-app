"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function createSessionKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();

  // Older mobile browsers may expose crypto without randomUUID(). This key only
  // groups anonymous activity within one browser session, not authentication.
  const bytes = new Uint32Array(2);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 0xffffffff);
    bytes[1] = Math.floor(Math.random() * 0xffffffff);
  }
  return `mida-${Date.now().toString(36)}-${bytes[0].toString(36)}${bytes[1].toString(36)}`;
}

function sessionKey() {
  const storageKey = "mida_activity_session";
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const created = createSessionKey();
  window.sessionStorage.setItem(storageKey, created);
  return created;
}

function sendActivity(payload: Record<string, unknown>, unload = false) {
  const body = JSON.stringify(payload);
  if (unload && navigator.sendBeacon) {
    navigator.sendBeacon("/api/activity", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: unload,
  });
}

/** Records lightweight page visit and duration events without collecting visitor PII. */
export function UsageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let lastRecordedAt = Date.now();
    const key = sessionKey();
    const isAdminPage = pathname.startsWith("/admin");
    sendActivity({ action: isAdminPage ? "ADMIN_VIEW" : "PAGE_VISIT", path: pathname, session_key: key });

    // Audit logs for the admin area intentionally record only view/create/update/delete.
    if (isAdminPage) return;

    function recordDuration(unload = false) {
      const now = Date.now();
      const durationSeconds = Math.round((now - lastRecordedAt) / 1000);
      if (durationSeconds < 1) return;
      lastRecordedAt = now;
      sendActivity(
        { action: "PAGE_DURATION", path: pathname, session_key: key, duration_seconds: durationSeconds },
        unload,
      );
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") recordDuration(true);
    }

    function handlePageHide() {
      recordDuration(true);
    }

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      recordDuration(true);
    };
  }, [pathname]);

  return null;
}
