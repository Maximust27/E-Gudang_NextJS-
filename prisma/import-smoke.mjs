import "dotenv/config"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { createPrismaClient, parseDatabaseUrl } from "../lib/db-client.ts"
import { previewProductImport, commitProductImport } from "../lib/master/import-service.ts"
import { MasterError } from "../lib/master/service.ts"

if (!parseDatabaseUrl(process.env.DATABASE_URL).database.endsWith("_test")) throw new Error("Import smoke requires a separate _test database")
const prisma = createPrismaClient()
const marker = randomUUID()
const label = "IMPORT-" + marker
const actorIds = []
const categoryIds = []

const source = (row, sku, barcode, category, method = "DEFAULT") => ({
  row, cells: [sku, "Barang " + sku, barcode, category, method, 12, 5, "Aktif"],
})
const adminUser = async (role, suffix) => {
  const user = await prisma.user.create({ data: {
    email: marker + "-" + suffix + "@example.invalid", name: label, role, passwordHash: "TEST_ONLY_NOT_A_CREDENTIAL",
  } })
  actorIds.push(user.id)
  return user
}

try {
  const admin = await adminUser("ADMIN", "admin")
  const admin2 = await adminUser("ADMIN", "admin2")
  const operator = await adminUser("OPERATOR", "operator")
  const fifo = await prisma.category.create({ data: { name: label + "-fifo", defaultMethod: "FIFO" } })
  categoryIds.push(fifo.id)
  const fefo = await prisma.category.create({ data: { name: label + "-fefo", defaultMethod: "FEFO" } })
  categoryIds.push(fefo.id)
  const invalidRows = [
    source(2, label + "-duplicate", "00" + marker + "-A", fifo.name),
    source(3, label + "-DUPLICATE", "00" + marker + "-B", fifo.name),
    source(4, label + "-bad", "LOT-" + marker, fefo.name, "FIFO"),
    source(5, label + "-unknown", "00" + marker + "-C", label + "-missing"),
    source(6, label + "-x", "00" + marker + "-D", fifo.name),
    source(7, label + "-y", "00" + marker + "-d", fifo.name),
  ]
  const invalid = await previewProductImport(prisma, invalidRows)
  assert.equal(invalid.invalid, 6)
  assert.equal(invalid.fingerprint, null)
  assert.ok(invalid.rows[0].issues.some((issue) => /SKU duplikat/.test(issue)))
  assert.ok(invalid.rows[4].issues.some((issue) => /Barcode duplikat/.test(issue)))
  assert.equal(await prisma.product.count({ where: { categoryId: { in: categoryIds } } }), 0)

  const valid = [
    source(2, label + "-1", "00" + marker + "-1", fifo.name),
    source(3, label + "-2", "00" + marker + "-2", fefo.name),
  ]
  const preview = await previewProductImport(prisma, valid)
  assert.equal(preview.valid, 2)
  assert.equal(preview.invalid, 0)
  assert.ok(preview.fingerprint)
  assert.equal(preview.rows[1].method, "FEFO")
  await assert.rejects(commitProductImport(prisma, operator.id, valid, preview.fingerprint), (error) => error instanceof MasterError && /Admin/.test(error.message))
  await prisma.category.update({ where: { id: fifo.id }, data: { defaultMethod: "FEFO" } })
  await assert.rejects(commitProductImport(prisma, admin.id, valid, preview.fingerprint), (error) => error instanceof MasterError && /berubah/.test(error.message))
  const fresh = await previewProductImport(prisma, valid)
  assert.equal(await commitProductImport(prisma, admin.id, valid, fresh.fingerprint), 2)
  const stored = await prisma.product.findMany({ where: { categoryId: { in: categoryIds } }, orderBy: { sku: "asc" } })
  assert.equal(stored.length, 2)
  assert.equal(stored[0].cartonBarcode, "00" + marker + "-1")
  assert.equal(await prisma.inventoryBatch.count({ where: { productId: { in: stored.map((row) => row.id) } } }), 0)
  assert.equal(await prisma.activityLog.count({ where: { userId: admin.id, entityType: "Product", action: "CREATE" } }), 2)
  const repeated = await previewProductImport(prisma, valid)
  assert.equal(repeated.invalid, 2)
  assert.ok(repeated.rows[0].issues.some((issue) => /SKU sudah/.test(issue)))
  await assert.rejects(commitProductImport(prisma, admin.id, valid, fresh.fingerprint), MasterError)

  // Two admins, different categories, overlapping second SKU. One whole
  // import may succeed; the loser's private first SKU must never survive.
  const a = [source(2, label + "-race-a", marker + "-race-a", fifo.name), source(3, label + "-race-shared", marker + "-race-shared-a", fifo.name)]
  const b = [source(2, label + "-race-b", marker + "-race-b", fefo.name), source(3, label + "-race-shared", marker + "-race-shared-b", fefo.name)]
  const [pa, pb] = await Promise.all([previewProductImport(prisma, a), previewProductImport(prisma, b)])
  assert.ok(pa.fingerprint && pb.fingerprint)
  const results = await Promise.allSettled([
    commitProductImport(prisma, admin.id, a, pa.fingerprint),
    commitProductImport(prisma, admin2.id, b, pb.fingerprint),
  ])
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1)
  const race = await prisma.product.findMany({ where: { sku: { startsWith: label + "-race-" } } })
  assert.equal(race.length, 2)
  const winner = results[0].status === "fulfilled" ? "a" : "b"
  assert.ok(race.some((row) => row.sku === label + "-race-" + winner))
  assert.equal(await prisma.activityLog.count({ where: { userId: { in: actorIds }, entityType: "Product", action: "CREATE" } }), 4)
  console.log("Import smoke passed: preview, collation duplicates, role, stale preview, atomic writes/audit, concurrent conflict and no stock mutations.")
} finally {
  await prisma.activityLog.deleteMany({ where: { userId: { in: actorIds } } })
  await prisma.product.deleteMany({ where: { categoryId: { in: categoryIds } } })
  await prisma.category.deleteMany({ where: { id: { in: categoryIds } } })
  await prisma.user.deleteMany({ where: { id: { in: actorIds } } })
  await prisma.$disconnect()
}
