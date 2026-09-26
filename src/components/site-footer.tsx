import Link from "next/link";

const socialLinks = [
  {
    href: "https://www.facebook.com/midapropertycompany/",
    label: "Facebook",
    icon: "fa-facebook-f",
  },
  {
    href: "https://www.youtube.com/channel/UCB7h58xbypfs8dIs7WBFWRw",
    label: "YouTube",
    icon: "fa-youtube",
  },
];

export function SiteFooter({
  projectName,
  contact,
  facebookUrl,
  lineUrl,
}: {
  projectName?: string;
  contact?: string | null;
  facebookUrl?: string | null;
  lineUrl?: string | null;
}) {
  const socials = [
    { ...socialLinks[0], href: facebookUrl || socialLinks[0].href },
    socialLinks[1],
    ...(lineUrl
      ? [
          {
            href: lineUrl,
            label: "LINE",
            icon: "fa-line",
          },
        ]
      : []),
  ];

  return (
    <footer className="border-t-4 border-brand-accent bg-brand-primary text-white">
      <div className="container-page grid gap-9 py-10 sm:py-12 lg:grid-cols-[1.3fr_0.8fr_1fr] lg:gap-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 font-extrabold tracking-tight">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-accent text-base text-brand-primary shadow-lg">
              M
            </span>
            <span className="text-lg">MIDA PROPERTY</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-blue-100">
            {projectName
              ? `ข้อมูลและข้อเสนอพิเศษจากโครงการ ${projectName}`
              : "พื้นที่ตอบทุกนิยามของคำว่าบ้าน ค้นหาโครงการ MIDA ที่เหมาะกับทุกจังหวะชีวิต"}
          </p>
          {contact && <p className="mt-3 text-sm font-semibold text-brand-accent">{contact}</p>}
        </div>

        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-accent">DISCOVER MIDA</p>
          <nav className="mt-4 grid gap-2.5 text-sm text-blue-100">
            <Link href="/" className="transition hover:text-brand-accent">
              หน้าแรก
            </Link>
            <Link href="/projects" className="transition hover:text-brand-accent">
              โครงการทั้งหมด
            </Link>
            <Link href="/#promotion" className="transition hover:text-brand-accent">
              ข่าวสารและโปรโมชั่น
            </Link>
            <Link href="/#location" className="transition hover:text-brand-accent">
              ทำเลโครงการ
            </Link>
          </nav>
        </div>

        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-accent">FOLLOW MIDA PROPERTY</p>
          <p className="mt-4 text-sm leading-6 text-blue-100">ติดตามข่าวสาร โครงการใหม่ และกิจกรรมพิเศษของเรา</p>
          <div className="mt-5 flex gap-3">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`ติดตาม MIDA Property บน ${social.label}`}
                className="grid size-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-lg transition hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-accent hover:text-brand-primary"
              >
                <i className={`fa-brands ${social.icon}`} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-blue-200 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} บริษัท ไมด้า เอเจนซี่ แอนด์ ดีเวลลอปเม้นท์ จำกัด.</p>
          <Link href="/login" className="transition hover:text-brand-accent">
            <i className="fa-solid fa-lock mr-1.5" aria-hidden="true" />
            สำหรับผู้ดูแลระบบ
          </Link>
        </div>
      </div>
    </footer>
  );
}
