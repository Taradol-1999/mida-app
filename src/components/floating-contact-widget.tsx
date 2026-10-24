"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/components/language-provider";
import { type ContactChannel, type WidgetChannels } from "@/lib/contact-widget-options";

export function FloatingContactWidget({
  lineUrl,
  messengerUrl,
  tiktokUrl,
  youtubeUrl,
  widgetChannels,
  phone,
  email,
}: {
  lineUrl?: string;
  messengerUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  widgetChannels?: Partial<WidgetChannels>;
  phone: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const widget = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!widget.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const contacts = [
    { channel: "line", label: "LINE", href: lineUrl, icon: "fa-brands fa-line", color: "bg-social-line" },
    {
      channel: "messenger",
      label: "Messenger",
      href: messengerUrl,
      icon: "fa-brands fa-facebook-messenger",
      color: "bg-social-messenger",
    },
    { channel: "tiktok", label: "TikTok", href: tiktokUrl, icon: "fa-brands fa-tiktok", color: "bg-social-tiktok" },
    {
      channel: "youtube",
      label: "YouTube",
      href: youtubeUrl,
      icon: "fa-brands fa-youtube",
      color: "bg-social-youtube",
    },
    {
      label: t({ th: "อีเมล", en: "Email" }),
      channel: "email",
      href: email ? `mailto:${encodeURIComponent(email)}` : undefined,
      icon: "fa-solid fa-envelope text-red-600",
      color: "bg-white",
    },
    {
      label: t({ th: phone ? `โทร ${phone}` : "โทรศัพท์", en: phone ? `Call ${phone}` : "Phone" }),
      channel: "phone",
      href: phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined,
      icon: "fa-solid fa-phone text-sm",
      color: "bg-brand-text",
    },
  ].filter((contact) => Boolean(contact.href) && widgetChannels?.[contact.channel as ContactChannel] !== false);

  if (!contacts.length) return null;

  return (
    <div ref={widget} className="fixed bottom-5 right-4 z-999 sm:bottom-7 sm:right-7">
      <div
        id={menuId}
        aria-hidden={!open}
        className={`absolute bottom-full right-0 mb-3 flex flex-col items-end gap-2 transition-all duration-300 motion-reduce:transition-none ${open ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0"}`}
      >
        {contacts.map((contact, index) => {
          const content = (
            <>
              <span className="hidden rounded-lg text-nowrap bg-white px-3 py-1.5 text-xs font-semibold text-brand-primary shadow-md sm:block">
                {contact.label}
              </span>
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full ${contact.color} text-xl text-white shadow-lg`}
              >
                <i className={contact.icon} aria-hidden="true" />
              </span>
            </>
          );
          return (
            <div
              key={contact.label}
              style={{ transitionDelay: open ? `${(contacts.length - 1 - index) * 55}ms` : "0ms" }}
              className={`whitespace-nowrap transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-90 opacity-0"}`}
            >
              {contact.href && (
                <a
                  key={contact.label}
                  href={contact.href}
                  aria-label={contact.label}
                  target={contact.href.startsWith("https://") ? "_blank" : undefined}
                  rel={contact.href.startsWith("https://") ? "noopener noreferrer" : undefined}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 transition hover:-translate-x-1"
                >
                  {content}
                </a>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={
          open
            ? t({ th: "ปิดช่องทางติดต่อ", en: "Close contact options" })
            : t({ th: "ช่องทางติดต่อ", en: "Contact us" })
        }
        onClick={() => setOpen((value) => !value)}
        className="grid size-14 cursor-pointer place-items-center rounded-full border-2 border-white bg-brand-primary text-white shadow-contact-widget transition duration-300 hover:scale-105 hover:bg-brand-accent active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <i
          className={`fa-solid ${open ? "fa-xmark rotate-90" : "fa-comments rotate-0"} text-xl transition-transform duration-300 motion-reduce:transition-none `}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
