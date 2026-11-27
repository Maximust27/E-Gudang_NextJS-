import { getPrisma } from "@/lib/prisma"

export const loginLimits = {
  global: { attempts: 60, durationMs: 60_000 },
  account: { attempts: 5, durationMs: 300_000 },
  unknown: { attempts: 10, durationMs: 60_000 },
} as const

// Reserve attempts atomically. Existing user IDs, plus two fixed keys, bound
// the number of rows; arbitrary email addresses never become database keys.
export async function reserveLoginAttempt(key: string, limit: { attempts: number; durationMs: number }) {
  const now = new Date()
  const resetAt = new Date(now.getTime() + limit.durationMs)

  return getPrisma().$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO login_rate_limits (\`key\`, attempts, reset_at)
      VALUES (${key}, 1, ${resetAt})
      ON DUPLICATE KEY UPDATE
        attempts = IF(reset_at <= ${now}, 1, LEAST(attempts + 1, ${limit.attempts + 1})),
        reset_at = IF(reset_at <= ${now}, ${resetAt}, reset_at)
    `
    const row = await tx.loginRateLimit.findUniqueOrThrow({ where: { key }, select: { attempts: true } })
    return row.attempts <= limit.attempts
  })
}
