"use client";

export function LeadOpenButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("mida:open-lead"))} className={className}>
      {children}
    </button>
  );
}
