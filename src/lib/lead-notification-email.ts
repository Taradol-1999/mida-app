import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type LeadNotificationInput = {
  projectId?: string;
  name: string;
  phone: string;
  ageRange?: string;
  occupation: string;
  province?: string;
  district?: string;
  budget?: string;
  preferredContactDate?: string;
  preferredContactTime?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function display(value?: string) {
  return value?.trim() || "-";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function uniqueEmails(values: Array<string | null | undefined>) {
  const emails = new Map<string, string>();
  for (const rawValue of values) {
    const value = rawValue?.trim();
    if (!value || !isEmail(value)) continue;
    const key = value.toLocaleLowerCase("en-US");
    if (!emails.has(key)) emails.set(key, value);
  }
  return [...emails.values()];
}

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER)?.trim();
  if (!host || !fromEmail) return null;

  const portValue = Number(process.env.SMTP_PORT || "587");
  const port = Number.isInteger(portValue) && portValue > 0 ? portValue : 587;
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME?.trim() || "Mida Property",
    auth: user && password ? { user, pass: password } : undefined,
  };
}

export async function sendLeadNotificationEmail(lead: LeadNotificationInput) {
  const smtp = smtpConfig();
  if (!smtp) {
    console.warn("Lead notification email skipped: SMTP_HOST or SMTP_FROM_EMAIL is not configured");
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const [superAdmins, marketingUsers, project] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SUPER_ADMIN", is_active: true },
      select: { email: true },
    }),
    lead.projectId
      ? prisma.user.findMany({
          where: {
            role: "MARKETING",
            is_active: true,
            projects: { some: { project_id: lead.projectId } },
          },
          select: { email: true },
        })
      : Promise.resolve([]),
    lead.projectId
      ? prisma.project.findUnique({
          where: { id: lead.projectId },
          select: { name_th: true, settings: { select: { email: true } } },
        })
      : Promise.resolve(null),
  ]);

  const recipients = uniqueEmails([
    ...superAdmins.map(({ email }) => email),
    ...marketingUsers.map(({ email }) => email),
    project?.settings?.email,
  ]);
  if (recipients.length === 0) {
    console.warn("Lead notification email skipped: no eligible recipients");
    return { sent: false, reason: "no_recipients" as const };
  }

  const projectName = project?.name_th || "Mida Property";
  const fields = [
    ["ชื่อ-นามสกุล", lead.name],
    ["เบอร์โทรศัพท์", lead.phone],
    ["ช่วงอายุ", display(lead.ageRange)],
    ["อาชีพ", lead.occupation],
    ["จังหวัด", display(lead.province)],
    ["เขต / อำเภอ", display(lead.district)],
    ["งบประมาณ", display(lead.budget)],
    ["วันที่สะดวกให้ติดต่อกลับ", display(lead.preferredContactDate)],
    ["ช่วงเวลาที่สะดวก", display(lead.preferredContactTime)],
  ];
  const submittedAt = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date());

  const rows = fields
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#64748b;width:38%;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#0f355f;font-weight:600;vertical-align:top">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  await transporter.sendMail({
    from: { name: smtp.fromName, address: smtp.fromEmail },
    bcc: recipients,
    subject: `[ลูกค้าใหม่] ลงทะเบียนรับข้อเสนอพิเศษ - ${projectName}`,
    text: [
      `มีลูกค้าลงทะเบียนรับข้อเสนอพิเศษจากโครงการ ${projectName}`,
      `วันที่ลงทะเบียน: ${submittedAt}`,
      "",
      ...fields.map(([label, value]) => `${label}: ${value}`),
    ].join("\n"),
    html: `
      <div style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,'Noto Sans Thai',sans-serif">
        <div style="max-width:680px;margin:0 auto;overflow:hidden;border-radius:18px;background:#ffffff;box-shadow:0 10px 30px rgba(15,53,95,.12)">
          <div style="background:#073767;padding:24px 28px;color:#ffffff">
            <div style="font-size:12px;letter-spacing:.16em;color:#fbbf24;font-weight:700">MIDA PROPERTY</div>
            <h1 style="margin:8px 0 0;font-size:24px;line-height:1.35">มีลูกค้าลงทะเบียนใหม่</h1>
            <p style="margin:8px 0 0;color:#dbeafe">โครงการ ${escapeHtml(projectName)}</p>
          </div>
          <div style="padding:22px 28px">
            <p style="margin:0 0 18px;color:#475569">ลงทะเบียนเมื่อ ${escapeHtml(submittedAt)}</p>
            <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px">${rows}</table>
            <p style="margin:18px 0 0;color:#64748b;font-size:13px">กรุณาติดต่อกลับลูกค้าตามวันและเวลาที่แจ้งไว้</p>
          </div>
        </div>
      </div>`,
  });

  return { sent: true, recipientCount: recipients.length };
}
