import type { ReactNode } from "react";
import { HomeHeader } from "@/components/home-header";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";

/** Shared navigation and footer for MIDA pages, independent of project pages. */
export async function MidaPageLayout({ children, innerPage = false }: { children: ReactNode; innerPage?: boolean }) {
  const session = await getSession();
  return (
    <main>
      <HomeHeader showAdmin={Boolean(session)} innerPage={innerPage} />
      {children}
      <SiteFooter />
    </main>
  );
}
