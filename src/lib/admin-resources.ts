export const adminResources = ["projects", "house-types", "facilities", "promotions", "news", "leads", "content", "users"] as const;

export type AdminResource = typeof adminResources[number];
