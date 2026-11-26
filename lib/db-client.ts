import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "../generated/prisma/client.ts"

// The CLI and runtime use the same local TCP DATABASE_URL.
export function parseDatabaseUrl(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required")

  const url = new URL(value)
  const database = decodeURIComponent(url.pathname.slice(1))
  if (
    url.protocol !== "mysql:" ||
    !url.hostname ||
    !url.username ||
    !database ||
    database.includes("/") ||
    url.search ||
    url.hash
  ) {
    throw new Error("Use a plain mysql://USER:PASSWORD@HOST:PORT/DATABASE URL")
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    timezone: "+00:00",
    connectionLimit: 5,
  }
}

export function createPrismaClient(value = process.env.DATABASE_URL) {
  return new PrismaClient({ adapter: new PrismaMariaDb(parseDatabaseUrl(value)) })
}
