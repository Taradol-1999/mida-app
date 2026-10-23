import { z } from "zod";

export const projectShowcaseSchema = z.object({
  title: z.string().trim().min(1).max(255),
  titleEn: z.string().max(255).optional(),
  description: z.string().max(10000),
  descriptionEn: z.string().max(10000).optional(),
  items: z
    .array(
      z.object({
        mediaId: z.string().uuid(),
        name: z.string().trim().min(1).max(255),
        nameEn: z.string().max(255).optional(),
        description: z.string().max(1000),
        descriptionEn: z.string().max(1000).optional(),
      }),
    )
    .max(100),
});
export type ProjectShowcaseData = z.infer<typeof projectShowcaseSchema>;
export const showcaseKey = (projectId: string) => `project_showcase_${projectId}`;
