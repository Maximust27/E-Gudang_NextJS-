import { compare, hash } from "bcryptjs"
import { randomBytes } from "node:crypto"

import { getPrisma } from "@/lib/prisma"
import { credentialsSchema, passwordCost } from "./credentials"
import { loginLimits, reserveLoginAttempt } from "./rate-limit"

let dummyHash: Promise<string> | undefined

export async function authorizeCredentials(input: unknown) {
  const parsed = credentialsSchema.safeParse(input)
  if (!parsed.success) return null
  if (!await reserveLoginAttempt("global", loginLimits.global)) return null

  const { email, password } = parsed.data
  const user = await getPrisma().user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true, isActive: true, sessionVersion: true },
  })

  const allowed = user
    ? await reserveLoginAttempt("user:" + user.id, loginLimits.account)
    : await reserveLoginAttempt("unknown", loginLimits.unknown)
  if (!allowed) return null

  // A dummy bcrypt verification avoids the most obvious timing difference
  // for unknown users. Never expose distinct account state in error messages.
  const storedHash = user?.passwordHash ?? await (dummyHash ??= hash(randomBytes(32).toString("hex"), passwordCost))
  const valid = await compare(password, storedHash)
  if (!valid || !user?.isActive) return null

  return { id: String(user.id), email: user.email, name: user.name, sessionVersion: user.sessionVersion }
}
