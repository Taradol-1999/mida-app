import { z } from "zod";

export const projectPopupItemSchema = z.object({
  id: z.string().uuid(),
  imageId: z.string().uuid(),
  isActive: z.boolean(),
});

export const projectPopupSchema = z.object({
  items: z.array(projectPopupItemSchema).max(100),
});

const legacyPopupSchema = z.object({
  imageId: z.string().uuid().nullable(),
  isActive: z.boolean(),
});

export type ProjectPopupItem = z.infer<typeof projectPopupItemSchema>;
export type ProjectPopupData = z.infer<typeof projectPopupSchema>;
export const projectPopupKey = (projectId: string) => `project_popup_${projectId}`;

export function readProjectPopup(value: unknown): ProjectPopupData {
  const current = projectPopupSchema.safeParse(value);
  if (current.success) return current.data;
  const legacy = legacyPopupSchema.safeParse(value);
  if (legacy.success && legacy.data.imageId)
    return {
      items: [{ id: legacy.data.imageId, imageId: legacy.data.imageId, isActive: legacy.data.isActive }],
    };
  return { items: [] };
}

