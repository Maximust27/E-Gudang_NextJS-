import "dotenv/config"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { hash } from "bcryptjs"
import { createPrismaClient, parseDatabaseUrl } from "../lib/db-client.ts"
import { passwordCost } from "../lib/auth/credentials.ts"

if (!parseDatabaseUrl(process.env.DATABASE_URL).database.endsWith("_test")) {
  throw new Error("Auth smoke requires a separate database ending in _test")
}

const base = new URL(process.env.AUTH_URL ?? "http://127.0.0.1:3000")
if (!["127.0.0.1", "localhost"].includes(base.hostname) || base.protocol !== "http:") {
  throw new Error("Auth smoke targets only a local HTTP test server")
}

const prisma = createPrismaClient()
const marker = randomUUID()
const password = "test-" + randomUUID()
const ids = []

function browser() {
  const cookies = new Map()
  async function request(path, options = {}) {
    const response = await fetch(new URL(path, base), {
      ...options,
      redirect: "manual",
      headers: {
        ...options.headers,
        cookie: Array.from(cookies, ([key, value]) => key + "=" + value).join("; "),
      },
    })
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(";")[0]
      const equals = pair.indexOf("=")
      const key = pair.slice(0, equals)
      const value = pair.slice(equals + 1)
      if (!value || /max-age=0(?:;|$)/i.test(raw)) cookies.delete(key)
      else cookies.set(key, value)
    }
    return response
  }
  async function session() {
    const response = await request("/api/auth/session")
    assert.equal(response.status, 200)
    return response.json()
  }
  async function submit(path, fields = {}) {
    const response = await request("/api/auth/csrf")
    assert.equal(response.status, 200)
    const { csrfToken } = await response.json()
    assert.ok(csrfToken)
    return request(path, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" },
      body: new URLSearchParams({ csrfToken, callbackUrl: base.origin + "/dashboard", ...fields }),
    })
  }
  return { request, session, submit }
}

async function signIn(client, email, value, expected) {
  const response = await client.submit("/api/auth/callback/credentials", { email, password: value })
  assert.ok(response.status < 500, "Auth handler must not return a server error")
  await response.text()
  const session = await client.session()
  assert.equal(session?.user?.email ?? null, expected)
}

async function page(client, path) {
  const response = await client.request(path)
  assert.ok(response.status < 500, "Page must not return a server error")
  const body = await response.text()
  assert.doesNotMatch(body, /blocking-prerender-crypto|encountered the unstable value/i, "Auth pages must render without blocking prerender errors")
  return { location: response.headers.get("location") ?? "", body }
}

try {
  const encoded = await hash(password, passwordCost)
  for (const [role, isActive] of [["ADMIN", true], ["OPERATOR", true], ["OPERATOR", false]]) {
    const user = await prisma.user.create({
      data: { email: marker + "-" + ids.length + "@example.invalid", name: "Test " + role, role, isActive, passwordHash: encoded },
      select: { id: true, email: true },
    })
    ids.push(user)
  }
  const [admin, operator, inactive] = ids
  const keys = ["global", "unknown", ...ids.map((user) => "user:" + user.id)]
  await prisma.loginRateLimit.deleteMany({ where: { key: { in: keys } } })

  const guest = browser()
  assert.ok((await page(guest, "/login")).body.includes("Masuk ke akun"))
  const denied = await page(guest, "/dashboard")
  assert.ok((denied.location + denied.body).includes("/login"))
  assert.ok(!denied.body.includes("Ringkasan operasional gudang."))

  const adminClient = browser()
  await signIn(adminClient, admin.email, password, admin.email)
  const settings = await page(adminClient, "/pengaturan")
  assert.ok(settings.body.includes("Kelola konfigurasi dan data master gudang."))
  assert.ok((await page(adminClient, "/pengaturan?tab=user")).body.includes("Tambah Pengguna"))
  const adminProducts = await page(adminClient, "/data-barang")
  assert.ok(adminProducts.body.includes("Tambah Barang"))
  assert.ok(adminProducts.body.includes("Import Excel"))

  const operatorClient = browser()
  await signIn(operatorClient, operator.email, password, operator.email)
  assert.ok((await page(operatorClient, "/dashboard")).body.includes("Ringkasan operasional gudang."))
  const products = await page(operatorClient, "/data-barang")
  assert.ok(products.body.includes("Kelola informasi SKU dan inventaris gudang."))
  assert.ok(!products.body.includes("Tambah Barang"))
  assert.ok(!products.body.includes("Import Excel"))
  const printDenied = await page(guest, "/cetak-label/sku/1")
  assert.ok((printDenied.location + printDenied.body).includes("/login"))
  assert.ok(!(await page(operatorClient, "/pengaturan?tab=user")).body.includes("Tambah Pengguna"))
  assert.ok(!(await page(operatorClient, "/pengaturan")).body.includes("Kelola konfigurasi dan data master gudang."))

  // Role changes must be enforced even for an existing valid JWT.
  await prisma.user.update({ where: { id: admin.id }, data: { role: "OPERATOR" } })
  assert.ok(!(await page(adminClient, "/pengaturan")).body.includes("Kelola konfigurasi dan data master gudang."))

  // Revocation invalidates app authorization without waiting eight hours.
  await prisma.user.update({ where: { id: admin.id }, data: { sessionVersion: { increment: 1 } } })
  const revoked = await page(adminClient, "/dashboard")
  assert.ok((revoked.location + revoked.body).includes("/login"))
  assert.ok(!revoked.body.includes("Ringkasan operasional gudang."))

  await signIn(browser(), inactive.email, password, null)
  await signIn(browser(), marker + "-unknown@example.invalid", password, null)

  const response = await operatorClient.submit("/api/auth/signout")
  assert.ok(response.status < 500)
  await response.text()
  assert.equal((await operatorClient.session())?.user?.email ?? null, null)

  // Account rate limit survives separate browser clients. Start a clean
  // window on this disposable fixture, then test correct password denial.
  await prisma.loginRateLimit.deleteMany({ where: { key: "user:" + operator.id } })
  for (let i = 0; i < 5; i++) await signIn(browser(), operator.email, "incorrect", null)
  await signIn(browser(), operator.email, password, null)
  const counter = await prisma.loginRateLimit.findUniqueOrThrow({ where: { key: "user:" + operator.id } })
  assert.equal(counter.attempts, 6)
  await prisma.loginRateLimit.update({ where: { key: "user:" + operator.id }, data: { resetAt: new Date(0) } })
  await signIn(browser(), operator.email, password, operator.email)

  console.log("Auth smoke passed: login, roles, route guards, inactive users, revocation, signout and throttling.")
} finally {
  await prisma.loginRateLimit.deleteMany({ where: { key: { in: ["global", "unknown", ...ids.map((user) => "user:" + user.id)] } } })
  await prisma.user.deleteMany({ where: { id: { in: ids.map((user) => user.id) } } })
  await prisma.$disconnect()
}
