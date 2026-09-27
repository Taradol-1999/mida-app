import { notFound, redirect } from "next/navigation";
import { ProjectEditor } from "@/components/project-editor";
import { ProjectWorkspace } from "@/components/project-workspace";
import { requireUser } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

const sections = [
  "dashboard",
  "project-info",
  "homepage",
  "house-types",
  "facilities",
  "promotions",
  "news",
  "contact",
  "after-sales",
  "leads",
] as const;
type Section = (typeof sections)[number];

type ProjectDashboardData = {
  views: number;
  leads: number;
  averageDuration: number;
  houseTypeViews: Array<{ label: string; value: number }>;
  contentViews: Array<{ label: string; value: number }>;
  demographics: {
    ages: Array<{ label: string; value: number; percent: number }>;
    occupations: Array<{ label: string; value: number; percent: number }>;
    budgets: Array<{ label: string; value: number; percent: number }>;
  };
};

function distribution(values: Array<string | null>) {
  const valuesByLabel = new Map<string, number>();
  for (const value of values) {
    if (!value?.trim()) continue;
    valuesByLabel.set(value, (valuesByLabel.get(value) ?? 0) + 1);
  }
  const total = [...valuesByLabel.values()].reduce((sum, value) => sum + value, 0);
  return [...valuesByLabel.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label, value]) => ({ label, value, percent: total ? Math.round((value / total) * 100) : 0 }));
}

async function getProjectDashboardData(projectId: string): Promise<ProjectDashboardData> {
  const projectWhere = { project_id: projectId };
  const publicVisitWhere = { ...projectWhere, area: "PUBLIC", action: "PAGE_VISIT" };
  const publicDurationWhere = { ...projectWhere, area: "PUBLIC", action: "PAGE_DURATION" };
  const sectionDurationWhere = { ...projectWhere, area: "PUBLIC", action: "SECTION_DURATION" };
  const [views, duration, sectionDuration, leads, houseTypes, houseTypeLogs, sectionLogs, demographicLeads] = await Promise.all([
    prisma.activityLog.count({ where: publicVisitWhere }),
    prisma.activityLog.aggregate({
      _avg: { duration_seconds: true },
      where: { ...publicDurationWhere, duration_seconds: { gt: 0 } },
    }),
    prisma.activityLog.aggregate({
      _avg: { duration_seconds: true },
      where: { ...sectionDurationWhere, duration_seconds: { gt: 0 } },
    }),
    prisma.lead.count({ where: projectWhere }),
    prisma.houseType.findMany({ where: projectWhere, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.activityLog.findMany({
      where: { ...projectWhere, area: "PUBLIC", action: "HOUSE_TYPE_VIEW" },
      select: { path: true },
    }),
    prisma.activityLog.findMany({
      where: { ...projectWhere, area: "PUBLIC", action: "SECTION_VIEW" },
      select: { path: true },
    }),
    prisma.lead.findMany({ where: projectWhere, select: { age_range: true, occupation: true, budget: true } }),
  ]);
  const sectionLabels = [
    { id: "project-top", label: "ภาพรวมโครงการ" },
    { id: "house-types", label: "ข้อมูลแบบบ้าน" },
    { id: "facilities", label: "สิ่งอำนวยความสะดวก" },
    { id: "project-promo-news", label: "โปรโมชั่น / ข่าวสาร" },
    { id: "map", label: "ทำเลที่ตั้ง" },
    { id: "mida-care", label: "บริการหลังการขาย" },
  ];
  const sectionCounts = new Map(sectionLabels.map((section) => [section.id, 0]));
  for (const activity of sectionLogs) {
    const sectionId = new URL(activity.path, "https://mida-property.local").searchParams.get("section");
    if (sectionId && sectionCounts.has(sectionId)) {
      sectionCounts.set(sectionId, (sectionCounts.get(sectionId) ?? 0) + 1);
    }
  }
  const contentViews = sectionLabels.map((section) => ({
    label: section.label,
    value: sectionCounts.get(section.id) ?? 0,
  }));

  const houseTypeCounts = new Map(houseTypes.map((houseType) => [houseType.id, 0]));
  for (const activity of houseTypeLogs) {
    const houseTypeId = new URL(activity.path, "https://mida-property.local").searchParams.get("houseType");
    if (houseTypeId && houseTypeCounts.has(houseTypeId)) {
      houseTypeCounts.set(houseTypeId, (houseTypeCounts.get(houseTypeId) ?? 0) + 1);
    }
  }

  return {
    views,
    leads,
    averageDuration: Math.round(duration._avg.duration_seconds || sectionDuration._avg.duration_seconds || 0),
    houseTypeViews: houseTypes.map((houseType) => ({ label: houseType.name, value: houseTypeCounts.get(houseType.id) ?? 0 })),
    contentViews,
    demographics: {
      ages: distribution(demographicLeads.map((lead) => lead.age_range)),
      occupations: distribution(demographicLeads.map((lead) => lead.occupation)),
      budgets: distribution(demographicLeads.map((lead) => lead.budget)),
    },
  };
}

export default async function ProjectSectionPage({ params }: { params: Promise<{ id: string; section: string }> }) {
  const user = await requireUser();
  const { id, section } = await params;
  if (!canAccessProject(user, id)) notFound();
  if (!sections.includes(section as Section)) notFound();
  const project = await prisma.project.findUnique({ where: { id }, select: { name_th: true } });
  if (!project) notFound();
  if (section === "homepage") redirect(`/admin/project/${id}/project-info`);
  if (section === "project-info") return <ProjectEditor selectedProjectId={id} mode="edit" />;
  const dashboard = section === "dashboard" ? await getProjectDashboardData(id) : undefined;
  return (
    <ProjectWorkspace
      projectId={id}
      projectName={project.name_th}
      section={section as Exclude<Section, "project-info">}
      dashboard={dashboard}
    />
  );
}
