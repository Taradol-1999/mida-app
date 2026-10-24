import type { ReactNode } from "react";
import { HomeHeader } from "@/components/home-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingContactWidget } from "@/components/floating-contact-widget";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Shared navigation and footer for MIDA pages, independent of project pages. */
export async function MidaPageLayout({
  children,
  innerPage = false,
  showLiving = true,
}: {
  children: ReactNode;
  innerPage?: boolean;
  showLiving?: boolean;
}) {
  const session = await getSession();
  const contact = await prisma.siteContent
    .findUnique({ where: { content_key: "floating_contact_widget" } })
    .catch(() => null);
  const contactEmail = await prisma.siteContent
    .findUnique({ where: { content_key: "floating_contact_email" } })
    .catch(() => null);
  const socialUrl = (value?: string) => {
    try {
      const url = new URL(value ?? "");
      return url.protocol === "https:" ? url.href : undefined;
    } catch {
      return undefined;
    }
  };
  return (
    <main id="mida-top">
      <HomeHeader showAdmin={Boolean(session)} innerPage={innerPage} showLiving={showLiving} />
      {children}
      <SiteFooter />
      <FloatingContactWidget
        lineUrl={socialUrl(contact ? (contact.body ?? "") : process.env.MIDA_LINE_URL)}
        messengerUrl={socialUrl(contact ? (contact.body_en ?? "") : process.env.MIDA_MESSENGER_URL)}
        phone={contact ? (contact.title_en ?? "") : "02 885 5558"}
        email={contactEmail?.body ?? ""}
      />
    </main>
  );
}
