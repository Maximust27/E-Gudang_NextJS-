import "server-only"

import { createPrismaClient } from "@/lib/db-client"

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createPrismaClient>
}

// Lazy singleton: no database connection or credentials required during build.
export function getPrisma() {
  return (globalForPrisma.prisma ??= createPrismaClient())
}
