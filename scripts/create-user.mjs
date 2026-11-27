import "dotenv/config"
import { createInterface } from "node:readline/promises"
import { Writable } from "node:stream"
import { hash } from "bcryptjs"
import { createPrismaClient, parseDatabaseUrl } from "../lib/db-client.ts"
import { newUserSchema, passwordCost } from "../lib/auth/credentials.ts"

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error("Input interaktif tidak tersedia. Jalankan langsung: node scripts/create-user.mjs")
  process.exit(1)
}

// Use the actual terminal for visible questions and a muted stream only
// for passwords. Always close the interface and fail explicitly on EOF.
async function readFields(questions, hide = false) {
  const output = hide ? new Writable({ write(_chunk, _encoding, callback) { callback() } }) : process.stdout
  if (hide) Object.assign(output, { isTTY: true, columns: process.stdout.columns, rows: process.stdout.rows })

  const rl = createInterface({ input: process.stdin, output, terminal: true })
  const controller = new AbortController()
  rl.on("close", () => controller.abort())
  rl.on("SIGINT", () => rl.close())
  const answers = []

  try {
    for (const prompt of questions) {
      if (hide) process.stdout.write(prompt)
      try {
        answers.push(await rl.question(hide ? "" : prompt, { signal: controller.signal }))
      } finally {
        if (hide) process.stdout.write("\n")
      }
    }
    return answers
  } finally {
    rl.close()
    if (hide) output.destroy()
  }
}

let prisma
try {
  const { database } = parseDatabaseUrl(process.env.DATABASE_URL)
  console.log("Database tujuan: " + database)
  prisma = createPrismaClient()
  // Fail before collecting credentials if the auth migration is missing.
  await prisma.user.findFirst({ select: { sessionVersion: true } })

  const [email, name, role] = await readFields(["Email: ", "Nama: ", "Role (ADMIN / OPERATOR): "])
  const [password, confirmation] = await readFields(["Password (min 15 karakter, maks 72 byte): ", "Ulangi password: "], true)

  if (password !== confirmation) throw new Error("PASSWORD_MISMATCH")
  const parsed = newUserSchema.safeParse({ email, name, role: role.trim().toUpperCase(), password })
  if (!parsed.success) throw new Error("INVALID_INPUT")

  const { password: plain, ...user } = parsed.data
  await prisma.user.create({
    data: { ...user, passwordHash: await hash(plain, passwordCost) },
    select: { id: true },
  })
  console.log("User berhasil dibuat.")
} catch (error) {
  const message = error instanceof Error ? error.message : ""
  if (message === "PASSWORD_MISMATCH") console.error("Konfirmasi password tidak cocok.")
  else if (message === "INVALID_INPUT") console.error("Email, nama, role, atau panjang password tidak valid.")
  else if (error?.name === "AbortError") console.error("Input dibatalkan atau terminal ditutup.")
  else if (error?.code === "P2002") console.error("Email sudah digunakan.")
  else if (error?.code === "P2022") console.error("Migration autentikasi belum diterapkan. Periksa npm run db:status.")
  else console.error("User tidak dibuat. Periksa input, koneksi dan migration database.")
  process.exitCode = 1
} finally {
  await prisma?.$disconnect()
}
