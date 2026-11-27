import "dotenv/config"
import { createInterface } from "node:readline/promises"
import { Writable } from "node:stream"
import { hash } from "bcryptjs"
import { createPrismaClient } from "../lib/db-client.ts"
import { newUserSchema, passwordCost } from "../lib/auth/credentials.ts"

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  throw new Error("Run this command in an interactive terminal.")
}

let hidden = false
const output = new Writable({
  write(chunk, encoding, callback) {
    if (hidden) callback()
    else process.stdout.write(chunk, encoding, callback)
  },
})
const rl = createInterface({ input: process.stdin, output, terminal: true })
rl.on("SIGINT", () => {
  rl.close()
  process.exitCode = 130
})

let prisma
try {
  const email = await rl.question("Email: ")
  const name = await rl.question("Nama: ")
  const role = (await rl.question("Role (ADMIN / OPERATOR): ")).trim().toUpperCase()

  async function secret(prompt) {
    process.stdout.write(prompt)
    hidden = true
    try {
      return await rl.question("")
    } finally {
      hidden = false
      process.stdout.write("\n")
    }
  }

  const password = await secret("Password (min 15 karakter, maks 72 byte): ")
  const confirmation = await secret("Ulangi password: ")
  if (password !== confirmation) throw new Error("Konfirmasi password tidak cocok.")

  const parsed = newUserSchema.safeParse({ email, name, role, password })
  if (!parsed.success) throw new Error("Email, nama, role, atau panjang password tidak valid.")

  prisma = createPrismaClient()
  const { password: plain, ...user } = parsed.data
  await prisma.user.create({
    data: { ...user, passwordHash: await hash(plain, passwordCost) },
    select: { id: true },
  })
  console.log("User berhasil dibuat.")
} catch {
  console.error("User tidak dibuat. Periksa input, koneksi, dan apakah email sudah digunakan.")
  process.exitCode ||= 1
} finally {
  rl.close()
  await prisma?.$disconnect()
}
