"use client";

import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Input } from "@/components/ui/form-controls";

type PasswordInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

/** Shows only the password currently being typed; saved password hashes are never returned from the server. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-1.5">
      <Input {...props} type={visible ? "text" : "password"} className={`!mt-0 block pr-11 ${className ?? ""}`} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-2 my-auto grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-brand-soft hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        aria-pressed={visible}
      >
        <i className={`fa-solid ${visible ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
      </button>
    </div>
  );
}
