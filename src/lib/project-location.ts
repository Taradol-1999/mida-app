import { z } from "zod";
import { placeIconNames } from "@/lib/place-icons";

const webUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    try {
      return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "กรุณาใส่ URL ที่ขึ้นต้นด้วย https:// หรือ http://");
export const projectLocationSchema = z.object({
  mapUrl: webUrl,
  imageId: z.string().uuid().nullable(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  places: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(255),
        nameEn: z.string().max(255).optional(),
        icon: z.enum(placeIconNames).optional(),
        url: webUrl.refine((value) => value.length > 0, "กรุณาใส่ URL สถานที่"),
      }),
    )
    .max(100),
});
export type ProjectLocationData = z.infer<typeof projectLocationSchema>;
export const projectLocationKey = (id: string) => `project_location_${id}`;
