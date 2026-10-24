import { z } from "zod";
import { contactOptionsInputSchema } from "@/lib/contact-widget-options";
const httpsUrl = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .url()
    .refine((value) => new URL(value).protocol === "https:"),
]);
export const projectContactSchema = z.object({
  ...contactOptionsInputSchema.shape,
  line: httpsUrl,
  messenger: httpsUrl,
  tiktok: httpsUrl.optional(),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\s-]*$/),
  email: z.union([z.literal(""), z.string().trim().email().max(190)]),
});
export const projectContactKey = (id: string) => `project_contact_${id}`;
