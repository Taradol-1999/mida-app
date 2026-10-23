import { z } from "zod";

export const projectShowcaseSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().max(10000),
  items: z
    .array(
      z.object({
        mediaId: z.string().uuid(),
        name: z.string().trim().min(1).max(255),
        description: z.string().max(1000),
      }),
    )
    .max(100),
});
export type ProjectShowcaseData = z.infer<typeof projectShowcaseSchema>;
export const showcaseKey = (projectId: string) => `project_showcase_${projectId}`;
