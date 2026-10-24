import { z } from "zod";

export const contactChannels = ["line", "messenger", "tiktok", "youtube", "phone", "email"] as const;
export type ContactChannel = (typeof contactChannels)[number];
export type WidgetChannels = Record<ContactChannel, boolean>;
export const defaultWidgetChannels: WidgetChannels = {
  line: true,
  messenger: true,
  tiktok: true,
  youtube: true,
  phone: true,
  email: true,
};
export const contactOptionsInputSchema = z.object({
  youtube: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .max(2000)
        .url()
        .refine((value) => new URL(value).protocol === "https:"),
    ])
    .optional(),
  widgetChannels: z
    .object({
      line: z.boolean(),
      messenger: z.boolean(),
      tiktok: z.boolean(),
      youtube: z.boolean(),
      phone: z.boolean(),
      email: z.boolean(),
    })
    .partial()
    .optional(),
});
export const contactOptionsKey = (projectId?: string) =>
  projectId ? `project_contact_options_${projectId}` : "floating_contact_options";

export function readContactOptions(body?: string | null): { youtube: string; widgetChannels: WidgetChannels } {
  try {
    const parsed = contactOptionsInputSchema.parse(JSON.parse(body || "{}"));
    return { youtube: parsed.youtube ?? "", widgetChannels: { ...defaultWidgetChannels, ...parsed.widgetChannels } };
  } catch {
    return { youtube: "", widgetChannels: { ...defaultWidgetChannels } };
  }
}

export function mergeContactOptions(body: string | null | undefined, input: z.infer<typeof contactOptionsInputSchema>) {
  const old = readContactOptions(body);
  return { youtube: input.youtube ?? old.youtube, widgetChannels: { ...old.widgetChannels, ...input.widgetChannels } };
}
