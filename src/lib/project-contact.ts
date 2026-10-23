import { z } from "zod";
const httpsUrl = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .url()
    .refine((value) => new URL(value).protocol === "https:"),
]);
export const projectContactSchema = z.object({
  line: httpsUrl,
  messenger: httpsUrl,
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\s-]*$/),
  email: z.union([z.literal(""), z.string().trim().email().max(190)]),
});
export const projectContactKey = (id: string) => `project_contact_${id}`;
