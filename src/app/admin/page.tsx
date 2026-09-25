import { Select } from "@/components/ui/form-controls";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type Metric = { label: string; value: string; note: string; tone: string };

async function dashboardData() {
  try {
    const [leads, projects, promotions, news, views, average, recent, leadGroups] = await Promise.all([
      prisma.lead.count(),
      prisma.project.count({ where: { status: { not: "ARCHIVED" } } }),
      prisma.promotion.count({ where: { is_published: true } }),
      prisma.newsItem.count({ where: { is_published: true } }),
      prisma.pageView.count(),
      prisma.pageView.aggregate({ _avg: { duration_seconds: true }, where: { duration_seconds: { not: null } } }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        select: { name: true, phone: true, status: true, created_at: true, project: { select: { name_th: true } } },
      }),
      prisma.lead.groupBy({ by: ["project_id"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
    ]);
    const projectNames = await prisma.project.findMany({
      where: { id: { in: leadGroups.flatMap((group) => (group.project_id ? [group.project_id] : [])) } },
      select: { id: true, name_th: true },
    });
    const names = new Map(projectNames.map((project) => [project.id, project.name_th]));
    return {
      leads,
      projects,
      published: promotions + news,
      views,
      seconds: Math.round(average._avg.duration_seconds ?? 0),
      recent: recent.map(({ project, ...lead }) => ({ ...lead, project_name: project?.name_th ?? null })),
      byProject: leadGroups.map((group) => ({
        name: group.project_id ? (names.get(group.project_id) ?? "เว็บไซต์กลาง") : "เว็บไซต์กลาง",
        total: group._count.id,
      })),
    };
  } catch {
    return {
      leads: 0,
      projects: 0,
      published: 0,
      views: 0,
      seconds: 0,
      recent: [] as Array<{
        name: string;
        phone: string;
        status: string;
        created_at: Date;
        project_name: string | null;
      }>,
      byProject: [] as Array<{ name: string; total: number }>,
    };
  }
}

function duration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function statusClass(status: string) {
  return status === "CONTACTED" || status === "CLOSED"
    ? "bg-emerald-100 text-emerald-700"
    : status === "QUALIFIED"
      ? "bg-brand-soft text-brand-primary"
      : "bg-amber-100 text-amber-800";
}

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role === "MARKETING") {
    if (user.projectIds[0]) redirect(`/admin/project/${user.projectIds[0]}/dashboard`);
    return (
      <p className="rounded-xl bg-white p-6 text-brand-text">
        ยังไม่มีโครงการที่ได้รับมอบหมาย กรุณาติดต่อ Super Admin เพื่อกำหนดสิทธิ์โครงการ
      </p>
    );
  }
  const data = await dashboardData();
  const metrics: Metric[] = [
    { label: "จำนวนการเข้าชมเว็บรวม", value: formatNumber(data.views), note: "ครั้ง", tone: "text-brand-primary" },
    { label: "ข้อมูลเฉลี่ยเวลาเข้าชม", value: duration(data.seconds), note: "นาที", tone: "text-brand-primary" },
    { label: "จำนวนผู้ลงทะเบียน", value: formatNumber(data.leads), note: "รายชื่อ", tone: "text-emerald-700" },
  ];
  const maxLeads = Math.max(...data.byProject.map((row) => Number(row.total)), 1);
  return (
    <>
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">ภาพรวมโครงการ</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">Dashboard MD</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <option>เดือนปัจจุบัน</option>
          </Select>
          <Select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <option>2569</option>
          </Select>
          <Link
            href="/api/admin/leads?format=csv"
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-primary shadow-sm transition hover:bg-brand-accent-soft"
          >
            ⇩ สร้างรายงาน Leads
          </Link>
        </div>
      </header>
      <div className="mt-6 grid gap-6 xl:grid-cols-[18rem_1fr]">
        <aside className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {metrics.map((metric) => (
            <section
              key={metric.label}
              className="rounded-2xl border border-brand-primary/15 bg-brand-soft p-5 shadow-sm"
            >
              <p className="border-l-4 border-brand-accent pl-2 text-xs font-bold uppercase tracking-wide text-brand-primary">
                {metric.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${metric.tone}`}>
                {metric.value} <span className="text-xs font-normal text-slate-500">{metric.note}</span>
              </p>
            </section>
          ))}
          <section className="rounded-2xl border border-brand-primary/15 bg-brand-soft p-5 shadow-sm">
            <p className="border-l-4 border-brand-accent pl-2 text-xs font-bold uppercase tracking-wide text-brand-primary">
              โซเชียลมีเดียยอดนิยม
            </p>
            <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              <p>
                1. Facebook <span className="float-right text-slate-400">55%</span>
              </p>
              <p>
                2. TikTok <span className="float-right text-slate-400">30%</span>
              </p>
              <p>
                3. LINE <span className="float-right text-slate-400">15%</span>
              </p>
            </div>
          </section>
        </aside>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-700">◉ จำนวนการลงทะเบียนทุกโครงการ</h2>
            <div className="mt-5 space-y-3">
              {data.byProject.length ? (
                data.byProject.map((row) => (
                  <div key={String(row.name)}>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span className="truncate pr-3">{row.name}</span>
                      <span>{row.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-brand-primary"
                        style={{ width: `${(Number(row.total) / maxLeads) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="grid h-38 place-items-center rounded-xl bg-slate-50 text-sm text-slate-400">
                  รอข้อมูลจากแบบฟอร์มลงทะเบียน
                </p>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-700">▥ ภาพรวมเนื้อหาบนเว็บไซต์</h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Link href="/admin/projects" className="rounded-xl bg-brand-soft p-4 text-center">
                <b className="block text-2xl text-brand-primary">{data.projects}</b>
                <span className="text-xs text-slate-500">โครงการ</span>
              </Link>
              <Link href="/admin/promotions" className="rounded-xl bg-brand-soft p-4 text-center">
                <b className="block text-2xl text-brand-primary">{data.published}</b>
                <span className="text-xs text-slate-500">เผยแพร่</span>
              </Link>
              <Link href="/admin/leads" className="rounded-xl bg-emerald-50 p-4 text-center">
                <b className="block text-2xl text-emerald-700">{data.leads}</b>
                <span className="text-xs text-slate-500">Leads</span>
              </Link>
            </div>
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              ข้อมูลการเข้าชมจะเพิ่มขึ้นเมื่อเชื่อมต่อระบบ Analytics หรือส่งข้อมูลเข้า `page_views`
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-700">▣ รายชื่อผู้ลงทะเบียนล่าสุด</h2>
                <p className="mt-1 text-xs text-slate-400">ข้อมูลจริงจากแบบฟอร์มหน้าเว็บไซต์</p>
              </div>
              <Link href="/admin/leads" className="text-xs font-bold text-brand-primary hover:underline">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-150 text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500">
                  <tr>
                    <th className="p-3">วันที่</th>
                    <th className="p-3">ชื่อ-นามสกุล</th>
                    <th className="p-3">โครงการ</th>
                    <th className="p-3">โทรศัพท์</th>
                    <th className="p-3">สถานะติดตาม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent.length ? (
                    data.recent.map((lead) => (
                      <tr key={`${lead.name}-${lead.created_at}`}>
                        <td className="p-3 text-slate-500">{new Date(lead.created_at).toLocaleDateString("th-TH")}</td>
                        <td className="p-3 font-semibold text-slate-700">{lead.name}</td>
                        <td className="p-3 text-slate-600">{lead.project_name ?? "เว็บไซต์กลาง"}</td>
                        <td className="p-3 text-slate-600">{lead.phone}</td>
                        <td className="p-3">
                          <span className={`rounded px-2 py-1 font-bold ${statusClass(String(lead.status))}`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400">
                        ยังไม่มีข้อมูลผู้ลงทะเบียน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
