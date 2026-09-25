import type { ComponentPropsWithRef } from "react";

type VariantProps = { variant?: "default" | "plain" };

function controlClass(variant: "default" | "plain", className?: string) {
  return [variant === "default" ? "form-control" : "", className].filter(Boolean).join(" ");
}

// Forward native props including ref, required, name, validation and events.
export function Input({
  className,
  variant = "default",
  type = "text",
  ...props
}: ComponentPropsWithRef<"input"> & VariantProps) {
  const nativeControl = ["checkbox", "radio", "file", "hidden", "range", "color"].includes(type);
  return <input {...props} type={type} className={controlClass(nativeControl ? "plain" : variant, className)} />;
}

export function Textarea({
  className,
  variant = "default",
  ...props
}: ComponentPropsWithRef<"textarea"> & VariantProps) {
  return <textarea {...props} className={controlClass(variant, className)} />;
}

export function Select({ className, variant = "default", ...props }: ComponentPropsWithRef<"select"> & VariantProps) {
  return <select {...props} className={controlClass(variant, className)} />;
}
