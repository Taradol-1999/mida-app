import { z } from "zod";

export const houseFloorplanSchema = z.object({
  items: z
    .array(
      z.object({
        mediaId: z.string().uuid(),
        description: z.string().max(1000),
        descriptionEn: z.string().max(1000).optional(),
      }),
    )
    .max(50),
});

export type HouseFloorplanData = z.infer<typeof houseFloorplanSchema>;
export const houseFloorplanKey = (houseTypeId: string) => `house_floorplan_${houseTypeId}`;

export function readHouseFloorplan(value: unknown): HouseFloorplanData {
  const parsed = houseFloorplanSchema.safeParse(value);
  return parsed.success ? parsed.data : { items: [] };
}
