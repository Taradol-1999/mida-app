"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Records one event whenever a visitor scrolls into a project navigation section. */
export function ProjectSectionTracker({ sectionIds }: { sectionIds: string[] }) {
  const pathname = usePathname();
  const activeSection = useRef<string | null>(null);
  const sectionStartedAt = useRef<number | null>(null);
  const sectionKey = sectionIds.join("|");

  useEffect(() => {
    let frame = 0;
    const sections = sectionKey.split("|").flatMap((id) => {
      const element = document.getElementById(id);
      return element ? [{ id, element }] : [];
    });

    function activityPayload(action: "SECTION_VIEW" | "SECTION_DURATION", id: string, durationSeconds?: number) {
      const sessionKey = window.sessionStorage.getItem("mida_activity_session") ?? undefined;
      return {
        action,
        path: `${pathname}?section=${encodeURIComponent(id)}`,
        session_key: sessionKey,
        ...(durationSeconds === undefined ? {} : { duration_seconds: durationSeconds }),
      };
    }

    function sendActivity(payload: ReturnType<typeof activityPayload>, unload = false) {
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

    function recordDuration(unload = false) {
      const id = activeSection.current;
      const startedAt = sectionStartedAt.current;
      if (!id || startedAt === null) return;
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      sendActivity(activityPayload("SECTION_DURATION", id, durationSeconds), unload);
    }

    function recordSection(id: string) {
      if (activeSection.current === id) return;
      recordDuration();
      activeSection.current = id;
      sectionStartedAt.current = Date.now();
      sendActivity(activityPayload("SECTION_VIEW", id));
    }

    function updateActiveSection() {
      frame = 0;
      const scrollPadding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 88;
      const marker = scrollPadding + 16;
      let active = sections[0]?.id;
      for (const section of sections) {
        if (section.element.getBoundingClientRect().top <= marker) active = section.id;
      }
      if (active) recordSection(active);
    }

    function scheduleUpdate() {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    }

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    return () => {
      recordDuration(true);
      activeSection.current = null;
      sectionStartedAt.current = null;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
    };
  }, [pathname, sectionKey]);

  return null;
}
