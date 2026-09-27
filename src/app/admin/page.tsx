import Link from "next/link";
import { DashboardBarChart, DashboardDoughnutChart, DashboardLineChart } from "@/components/dashboard-charts";
import { DashboardPeriodFilter } from "@/components/dashboard-period-filter";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type Metric = { label: string; value: string; note: string; tone: string };

async function dashboardData(startDate: Date, endDate: Date) {
  try {
    const periodWhere = { created_at: { gte: startDate, lt: endDate } };
    const publicVisitWhere = { ...periodWhere, area: "PUBLIC", action: "PAGE_VISIT" };
    const publicDurationWhere = { ...periodWhere, area: "PUBLIC", action: "PAGE_DURATION" };
    const [leads, views, average, leadHistory, viewGroups, durationGroups, residenceGroups, demographicLeads] =
      await Promise.all([
        prisma.lead.count({ where: periodWhere }),
        prisma.activityLog.count({ where: publicVisitWhere }),
        prisma.activityLog.aggregate({
          _avg: { duration_seconds: true },
          where: { ...publicDurationWhere, duration_seconds: { gt: 0 } },
        }),
        prisma.lead.findMany({ where: periodWhere, select: { created_at: true } }),
        prisma.activityLog.groupBy({
          by: ["project_id"],
          _count: { id: true },
          where: publicVisitWhere,
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),
        prisma.activityLog.groupBy({
          by: ["project_id"],
          _avg: { duration_seconds: true },
          where: { ...publicDurationWhere, duration_seconds: { gt: 0 } },
          orderBy: { _avg: { duration_seconds: "desc" } },
          take: 5,
        }),
        prisma.lead.groupBy({
          by: ["residence_type"],
          _count: { id: true },
          where: { ...periodWhere, residence_type: { not: null } },
          orderBy: { _count: { id: "desc" } },
        }),
        prisma.lead.findMany({ where: periodWhere, select: { age_range: true, occupation: true, budget: true } }),
      ]);
    const projectNames = await prisma.project.findMany({
      where: {
        id: {
          in: [...viewGroups, ...durationGroups].flatMap((group) => (group.project_id ? [group.project_id] : [])),
        },
      },
      select: { id: true, name_th: true },
    });
    const names = new Map(projectNames.map((project) => [project.id, project.name_th]));
    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000));
    const weeklyLeads = Array.from(
      { length: 4 },
      (_, index) =>
        leadHistory.filter((lead) => {
          const day = Math.floor((lead.created_at.getTime() - startDate.getTime()) / 86_400_000);
          return Math.min(3, Math.floor((day / periodDays) * 4)) === index;
        }).length,
    );
    const compactName = (projectId: string | null) =>
      projectId ? (names.get(projectId) ?? "โครงการ") : "เว็บไซต์กลาง";
    const distribution = (values: Array<string | null>) => {
      const totals = new Map<string, number>();
      for (const value of values) {
        if (!value?.trim()) continue;
        totals.set(value, (totals.get(value) ?? 0) + 1);
      }
      const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
      return [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([label, value]) => ({ label, value, percent: total ? Math.round((value / total) * 100) : 0 }));
    };
    return {
      leads,
      views,
      seconds: Math.round(average._avg.duration_seconds ?? 0),
      weeklyLeads,
      viewsByProject: viewGroups.map((group) => ({ name: compactName(group.project_id), total: group._count.id })),
      durationByProject: durationGroups.map((group) => ({
        name: compactName(group.project_id),
        seconds: Math.round(group._avg.duration_seconds ?? 0),
      })),
      residence: residenceGroups.map((group) => ({ label: group.residence_type ?? "ไม่ระบุ", value: group._count.id })),
      demographics: {
        ages: distribution(demographicLeads.map((lead) => lead.age_range)),
        occupations: distribution(demographicLeads.map((lead) => lead.occupation)),
        budgets: distribution(demographicLeads.map((lead) => lead.budget)),
      },
    };
  } catch {
    return {
      leads: 0,
      views: 0,
      seconds: 0,
      weeklyLeads: [0, 0, 0, 0],
      viewsByProject: [] as Array<{ name: string; total: number }>,
      durationByProject: [] as Array<{ name: string; seconds: number }>,
      residence: [] as Array<{ label: string; value: number }>,
      demographics: {
        ages: [] as Array<{ label: string; value: number; percent: number }>,
        occupations: [] as Array<{ label: string; value: number; percent: number }>,
        budgets: [] as Array<{ label: string; value: number; percent: number }>,
      },
    };
  }
}

function duration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function ChartShell({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(0,45,98,0.06)]">
      <h2 className="flex items-center gap-2 text-sm font-extrabold text-brand-primary">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-xs text-brand-primary">
          <i className={`fa-solid ${icon}`} aria-hidden="true" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "MARKETING") {
    if (user.projectIds[0]) redirect(`/admin/project/${user.projectIds[0]}/dashboard`);
    return (
      <p className="rounded-xl bg-white p-6 text-brand-text">
        ยังไม่มีโครงการที่ได้รับมอบหมาย กรุณาติดต่อ Super Admin เพื่อกำหนดสิทธิ์โครงการ
      </p>
    );
  }
  const query = await searchParams;
  const now = new Date();
  const requestedMonth = Number(query.month);
  const requestedYear = Number(query.year);
  const selectedMonth =
    Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
      ? requestedMonth
      : now.getMonth() + 1;
  const selectedYear =
    Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= now.getFullYear()
      ? requestedYear
      : now.getFullYear();
  const periodStart = new Date(selectedYear, selectedMonth - 1, 1);
  const periodEnd = new Date(selectedYear, selectedMonth, 1);
  const data = await dashboardData(periodStart, periodEnd);
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const years = Array.from({ length: 4 }, (_, index) => now.getFullYear() - index);
  const metrics: Metric[] = [
    { label: "จำนวนการเข้าชมเว็บรวม", value: formatNumber(data.views), note: "ครั้ง", tone: "text-brand-primary" },
    { label: "ข้อมูลเฉลี่ยเวลาเข้าชม", value: duration(data.seconds), note: "นาที:วินาที", tone: "text-brand-primary" },
    { label: "จำนวนผู้ลงทะเบียน", value: formatNumber(data.leads), note: "รายชื่อ", tone: "text-emerald-700" },
  ];
  const demographicPanels: Array<{
    title: string;
    rows: Array<{ label: string; value: number; percent: number }>;
  }> = [
    { title: "ช่วงอายุผู้ใช้งาน", rows: data.demographics.ages },
    { title: "อาชีพผู้ใช้งาน", rows: data.demographics.occupations },
    { title: "งบประมาณรวม", rows: data.demographics.budgets },
  ];
  return (
    <>
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">
            ภาพรวมโครงการ · {thaiMonths[selectedMonth - 1]} {selectedYear + 543}
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">Dashboard MD</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardPeriodFilter month={selectedMonth} year={selectedYear} months={thaiMonths} years={years} />
          <Link
            href="/api/admin/leads?format=csv"
            className="rounded-lg bg-brand-accent shrink-0 mt-1 px-4 py-3 text-sm font-bold text-brand-primary shadow-sm transition hover:bg-brand-accent-soft"
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
              className="relative overflow-hidden rounded-2xl border border-brand-primary/15 bg-linear-to-br from-brand-soft via-white to-brand-accent-soft/55 p-5 shadow-[0_10px_28px_rgba(0,45,98,0.08)]"
            >
              <span className="absolute -right-5 -top-7 size-24 rounded-full bg-brand-accent/15" aria-hidden="true" />
              <p className="border-l-4 border-brand-accent pl-2 text-xs font-bold uppercase tracking-wide text-brand-primary">
                {metric.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${metric.tone}`}>
                {metric.value} <span className="text-xs font-normal text-slate-500">{metric.note}</span>
              </p>
            </section>
          ))}
          <section className="rounded-2xl border border-brand-primary/15 bg-brand-primary p-5 text-white shadow-[0_10px_28px_rgba(0,45,98,0.16)] sm:col-span-3 xl:col-span-1">
            <p className="border-l-4 border-brand-accent pl-2 text-xs font-bold uppercase tracking-wide text-white">
              แหล่งที่มาที่รอติดตาม
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              {["Facebook", "TikTok", "LINE"].map((channel) => (
                <div key={channel} className="rounded-xl border border-white/15 bg-white/10 px-2 py-3">
                  <i
                    className={`fa-brands ${channel === "Facebook" ? "fa-facebook-f" : channel === "TikTok" ? "fa-tiktok" : "fa-line"} block text-lg text-brand-accent`}
                  />
                  <span className="mt-1.5 block text-white/85">{channel}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-white/60">
              เชื่อมต่อ Analytics เพื่อดูแหล่งที่มาของผู้เข้าชมจริง
            </p>
          </section>
        </aside>
        <div className="grid gap-6 md:grid-cols-2">
          <ChartShell title={`จำนวนการลงทะเบียน · ${thaiMonths[selectedMonth - 1]}`} icon="fa-chart-line">
            <div className="mt-4 rounded-xl bg-brand-muted p-3">
              <DashboardLineChart
                labels={data.weeklyLeads.map((_, index) => `สัปดาห์ ${index + 1}`)}
                values={data.weeklyLeads}
                label="ยอดลงทะเบียน"
              />
            </div>
          </ChartShell>
          <ChartShell title="ยอดเข้าชมตามโครงการ" icon="fa-chart-column">
            <div className="mt-4 rounded-xl bg-brand-muted p-3">
              <DashboardBarChart
                labels={data.viewsByProject.map((row) => row.name)}
                values={data.viewsByProject.map((row) => row.total)}
                label="ยอดผู้เข้าชม"
              />
            </div>
          </ChartShell>
          <ChartShell title="ประเภทที่อยู่อาศัยของผู้สนใจ" icon="fa-house">
            <div className="mt-4 rounded-xl bg-brand-muted p-3">
              <DashboardDoughnutChart
                labels={data.residence.map((item) => item.label)}
                values={data.residence.map((item) => item.value)}
                emptyLabel="รอข้อมูลจากแบบฟอร์ม"
              />
            </div>
          </ChartShell>
          <ChartShell title="เวลาเข้าชมเฉลี่ยตามโครงการ" icon="fa-clock-rotate-left">
            <div className="mt-4 rounded-xl bg-brand-muted p-3">
              <DashboardBarChart
                labels={data.durationByProject.map((row) => row.name)}
                values={data.durationByProject.map((row) => row.seconds)}
                label="วินาทีเฉลี่ย"
                color="#fcb040"
              />
            </div>
          </ChartShell>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(0,45,98,0.06)] md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-brand-primary">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-soft">
                  <i className="fa-solid fa-users-viewfinder text-xs" />
                </span>
                ข้อมูลเชิงลึก Demographics
              </h2>
              <span className="rounded-full bg-brand-accent-soft px-3 py-1 text-[0.65rem] font-bold text-brand-primary">
                อิงจากแบบฟอร์มลงทะเบียน
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {demographicPanels.map(({ title, rows }) => (
                <div key={title} className="rounded-xl bg-brand-muted p-4">
                  <p className="text-xs font-bold text-brand-primary">{title}</p>
                  {rows.length ? (
                    <div className="mt-3 space-y-2">
                      {rows.map((row) => (
                        <p key={row.label} className="flex justify-between text-xs text-slate-600">
                          <span className="truncate pr-2">{row.label}</span>
                          <b className="text-brand-primary">{row.percent}%</b>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">ยังไม่มีข้อมูลเพียงพอ</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
