import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"
import { connection } from "next/server"
import { auth } from "@/auth"
import { can, type Permission } from "@/lib/permissions"
import { getPrisma } from "@/lib/prisma"

// Request/render-scoped only; never cache authorization across requests.
export const getCurrentUser = cache(async () => {
  // Auth.js may access crypto before reading request headers. Keep all
  // session work behind the request boundary when Cache Components is enabled.
  await connection()
  const session = await auth()
  const id = Number(session?.user?.id)
  const version = session?.user?.sessionVersion
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647 ||
      !Number.isInteger(version) || version === undefined || version < 0) return null

  const user = await getPrisma().user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, sessionVersion: true },
  })

  if (!user?.isActive || user.sessionVersion !== version) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role }
})

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser()
  if (!can(user.role, permission)) notFound()
  return user
}
