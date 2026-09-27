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
  houseTypes: Array<{ label: string; value: number }>;
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
  const [views, duration, leads, houseTypes, pageViews, demographicLeads] = await Promise.all([
    prisma.pageView.count({ where: projectWhere }),
    prisma.pageView.aggregate({
      _avg: { duration_seconds: true },
      where: { ...projectWhere, duration_seconds: { not: null } },
    }),
    prisma.lead.count({ where: projectWhere }),
    prisma.houseType.findMany({ where: projectWhere, orderBy: { name: "asc" }, select: { name: true } }),
    prisma.pageView.findMany({ where: projectWhere, select: { path: true } }),
    prisma.lead.findMany({ where: projectWhere, select: { age_range: true, occupation: true, budget: true } }),
  ]);
  const contentViews = [
    { label: "หน้าแรกโครงการ", match: (path: string) => !/(gallery|house|location|map)/i.test(path) },
    { label: "แกลเลอรีรูปภาพ", match: (path: string) => /gallery/i.test(path) },
    { label: "ข้อมูลแบบบ้าน", match: (path: string) => /house/i.test(path) },
    { label: "ทำเลที่ตั้ง/แผนที่", match: (path: string) => /(location|map)/i.test(path) },
  ].map(({ label, match }) => ({ label, value: pageViews.filter((page) => match(page.path)).length }));

  return {
    views,
    leads,
    averageDuration: Math.round(duration._avg.duration_seconds ?? 0),
    houseTypes: houseTypes.map((houseType) => ({ label: houseType.name, value: 1 })),
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
