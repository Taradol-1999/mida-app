export const userRoles = ["MARKETING", "SUPER_ADMIN"] as const;
export type UserRole = (typeof userRoles)[number];
export const userRoleOptions = [
  ["MARKETING", "Marketing"],
  ["SUPER_ADMIN", "Super Admin"],
] satisfies [UserRole, string][];

export function isUserRole(value: unknown): value is UserRole {
  return value === "MARKETING" || value === "SUPER_ADMIN";
}
