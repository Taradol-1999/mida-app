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
  // Some browser extensions annotate form elements before React hydrates.
  // Ignore only that external markup difference; the controlled values still hydrate normally.
  return (
    <input
      {...props}
      suppressHydrationWarning
      type={type}
      className={controlClass(nativeControl ? "plain" : variant, className)}
    />
  );
}

export function Textarea({
  className,
  variant = "default",
  ...props
}: ComponentPropsWithRef<"textarea"> & VariantProps) {
  return <textarea {...props} suppressHydrationWarning className={controlClass(variant, className)} />;
}

export function Select({ className, variant = "default", ...props }: ComponentPropsWithRef<"select"> & VariantProps) {
  return <select {...props} suppressHydrationWarning className={controlClass(variant, className)} />;
}
