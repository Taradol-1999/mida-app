"use client";

import { useCallback, useState } from "react";
import { showAdminSuccess } from "@/lib/admin-alert";

type FeedbackKind = "success" | "error" | "warning";
type Feedback = { text: string; kind: FeedbackKind };

/** Success uses a non-blocking toast; errors stay visible beside the form. */
export function useAdminFeedback(defaultKind: FeedbackKind = "error") {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const update = useCallback(
    (text: string, kind: FeedbackKind = defaultKind) => {
      setFeedback(text ? { text, kind } : null);
      if (text && kind === "success") void showAdminSuccess(text);
    },
    [defaultKind],
  );
  return [feedback, update] as const;
}

export function AdminFeedback({ notice }: { notice: Feedback | null }) {
  if (!notice || notice.kind === "success") return null;
  return (
    <div
      role="alert"
      className={`admin-feedback ${notice.kind === "warning" ? "admin-feedback-warning" : "admin-feedback-error"}`}
    >
      <i
        className={`fa-solid ${notice.kind === "warning" ? "fa-triangle-exclamation" : "fa-circle-exclamation"} mt-0.5 shrink-0`}
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 break-words leading-6">{notice.text}</p>
    </div>
  );
}
