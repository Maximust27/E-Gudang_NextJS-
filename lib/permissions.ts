import type { Role } from "../generated/prisma/enums.ts"

export type { Role }

const operatorPermissions = [
  "dashboard:view",
  "products:view",
  "inbound:post",
  "outbound:post",
  "opname:count",
  "reports:view",
] as const

const adminPermissions = [
  ...operatorPermissions,
  "products:manage",
  "products:import",
  "opname:approve",
  "inventory:adjust",
  "transactions:reverse",
  "reports:export",
  "settings:manage",
  "users:manage",
  "audit:view",
] as const

export type Permission = (typeof adminPermissions)[number]

const permissions: Record<Role, readonly Permission[]> = {
  ADMIN: adminPermissions,
  OPERATOR: operatorPermissions,
}

export function can(role: Role, permission: Permission) {
  return permissions[role]?.includes(permission) ?? false
}

export const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  OPERATOR: "Operator",
}
