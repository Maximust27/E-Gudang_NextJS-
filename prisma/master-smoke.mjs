import "dotenv/config"
import assert from "node:assert/strict"
import { createHash, randomUUID } from "node:crypto"
import { compare } from "bcryptjs"
import { createPrismaClient, parseDatabaseUrl } from "../lib/db-client.ts"
import { MasterError, saveMaster } from "../lib/master/service.ts"
import { eligibleBatchWhere, batchStatus } from "../lib/inventory/eligibility.ts"
import { businessDate, settingKeys } from "../lib/master/schema.ts"

if (!parseDatabaseUrl(process.env.DATABASE_URL).database.endsWith("_test")) {
  throw new Error("Master smoke requires a separate database ending in _test")
}
const prisma = createPrismaClient()
const marker = randomUUID()
const label = "MASTER-" + marker
const password = "test-pass-" + marker
const identity = { id: null, updatedAt: null, isActive: "active" }
const actorIds = []
let category, supplier, location, product, inbound, item, batch
let originalSettings = []
const save = (actor, input) => saveMaster(prisma, actor.id, input)
const edit = (row) => ({ id: row.id, updatedAt: row.updatedAt.toISOString() })

try {
  const actor = await prisma.user.create({ data: { email: marker + "-admin@example.invalid", name: label, role: "ADMIN", passwordHash: "TEST_ONLY_NOT_A_CREDENTIAL" } })
  actorIds.push(actor.id)
  const operator = await prisma.user.create({ data: { email: marker + "-operator@example.invalid", name: label, role: "OPERATOR", passwordHash: "TEST_ONLY_NOT_A_CREDENTIAL" } })
  actorIds.push(operator.id)

  const categoryInput = { ...identity, kind: "category", name: label, defaultMethod: "FEFO" }
  await assert.rejects(save(operator, categoryInput), (error) => error instanceof MasterError && /Admin/.test(error.message))
  assert.equal(await prisma.category.count({ where: { name: label } }), 0)
  await save(actor, categoryInput)
  category = await prisma.category.findUniqueOrThrow({ where: { name: label } })
  await save(actor, { ...identity, kind: "supplier", name: label, code: label })
  supplier = await prisma.supplier.findUniqueOrThrow({ where: { code: label } })
  await save(actor, { ...identity, kind: "location", name: label, code: label })
  location = await prisma.location.findUniqueOrThrow({ where: { code: label } })
  const input = { ...identity, kind: "product", name: label, sku: label, cartonBarcode: "00" + marker, categoryId: String(category.id), methodOverride: "DEFAULT", piecesPerCarton: "24", minStock: "5" }
  await save(actor, input)
  product = await prisma.product.findUniqueOrThrow({ where: { sku: label } })
  assert.equal(product.cartonBarcode, "00" + marker)
  assert.equal(product.piecesPerCarton, 24)
  await assert.rejects(save(actor, { ...input, sku: label + "-2" }), (error) => error?.code === "P2002")
  await assert.rejects(save(actor, { ...input, ...edit(product), methodOverride: "FIFO" }), (error) => error instanceof MasterError && /FEFO/.test(error.message))
  await assert.rejects(save(actor, { ...input, ...edit(product), updatedAt: "2020-01-01T00:00:00.000Z" }), (error) => error instanceof MasterError && /berubah/.test(error.message))
  await assert.rejects(save(actor, { ...categoryInput, ...edit(category), isActive: "inactive" }), (error) => error instanceof MasterError && /SKU aktif/.test(error.message))

  const now = new Date()
  const today = businessDate(now)
  const expiryDate = new Date(today.getTime() + 86400000)
  inbound = await prisma.transaction.create({ data: {
    number: "IN-" + marker, type: "IN", status: "POSTED", supplierId: supplier.id, userId: actor.id, receivedAt: now, postedAt: now,
    idempotencyKey: marker, payloadHash: createHash("sha256").update(marker).digest("hex"),
  } })
  item = await prisma.transactionItem.create({ data: { transactionId: inbound.id, productId: product.id, quantity: 10 } })
  batch = await prisma.inventoryBatch.create({ data: {
    productId: product.id, locationId: location.id, receiptItemId: item.id, internalLotCode: "LOT-" + marker, receivedAt: now, expiryDate, qtyOnHand: 10,
  } })
  await prisma.stockMovement.create({ data: { transactionItemId: item.id, batchId: batch.id, signedDelta: 10, qtyBefore: 0, qtyAfter: 10 } })

  const candidate = { id: product.id, isActive: true, method: "FEFO" }
  const eligible = () => prisma.inventoryBatch.aggregate({ where: eligibleBatchWhere([candidate], today), _sum: { qtyOnHand: true } })
  assert.equal((await eligible())._sum.qtyOnHand, 10)
  assert.equal(batchStatus({ ...batch, location }, candidate, today), "Tersedia")
  await assert.rejects(save(actor, { ...input, ...edit(product), isActive: "inactive" }), (error) => error instanceof MasterError && /stok fisik/.test(error.message))
  await assert.rejects(save(actor, { ...categoryInput, ...edit(category), defaultMethod: "FIFO" }), (error) => error instanceof MasterError && /histori expiry/.test(error.message))
  await assert.rejects(save(actor, { ...identity, ...edit(location), kind: "location", name: label, code: label, isActive: "inactive" }), (error) => error instanceof MasterError && /stok fisik/.test(error.message))
  await prisma.inventoryBatch.update({ where: { id: batch.id }, data: { isBlocked: true, blockedReason: "Test" } })
  assert.equal((await eligible())._sum.qtyOnHand ?? 0, 0)
  await prisma.inventoryBatch.update({ where: { id: batch.id }, data: { isBlocked: false, blockedReason: null, expiryDate: today } })
  assert.equal((await eligible())._sum.qtyOnHand ?? 0, 0)
  assert.equal((await prisma.inventoryBatch.findUniqueOrThrow({ where: { id: batch.id } })).qtyOnHand, 10)

  const userInput = { ...identity, kind: "user", email: marker + "-new@example.invalid", name: label, role: "OPERATOR", password }
  await save(actor, userInput)
  const created = await prisma.user.findUniqueOrThrow({ where: { email: userInput.email } })
  actorIds.push(created.id)
  assert.equal(await compare(password, created.passwordHash), true)
  const changedPassword = password + "!"
  await save(actor, { ...userInput, ...edit(created), password: changedPassword, isActive: "inactive" })
  const updated = await prisma.user.findUniqueOrThrow({ where: { id: created.id } })
  assert.equal(updated.isActive, false)
  assert.equal(updated.sessionVersion, created.sessionVersion + 1)
  assert.equal(await compare(changedPassword, updated.passwordHash), true)
  await assert.rejects(save(actor, { ...userInput, ...edit(actor), email: actor.email, role: "OPERATOR", password: "" }), (error) => error instanceof MasterError && /akun sendiri/.test(error.message))

  originalSettings = await prisma.setting.findMany({ where: { key: { in: Object.values(settingKeys) } } })
  const near = originalSettings.find((row) => row.key === settingKeys.nearExpiryDays)
  const dead = originalSettings.find((row) => row.key === settingKeys.deadStockDays)
  const general = { kind: "general", nearExpiryDays: "31", deadStockDays: "61", nearVersion: near?.updatedAt.toISOString() ?? null, deadVersion: dead?.updatedAt.toISOString() ?? null }
  await save(actor, general)
  assert.equal((await prisma.setting.findUniqueOrThrow({ where: { key: settingKeys.nearExpiryDays } })).value, 31)
  assert.equal((await prisma.setting.findUniqueOrThrow({ where: { key: settingKeys.deadStockDays } })).value, 61)

  const logs = await prisma.activityLog.findMany({ where: { userId: actor.id } })
  assert.equal(logs.length, 9)
  const serialized = JSON.stringify(logs)
  assert.ok(!serialized.includes(password))
  assert.ok(!serialized.includes(updated.passwordHash))
  assert.ok(!serialized.includes('"passwordHash"'))
  assert.equal(logs.filter((log) => log.entityType === "Product").length, 1)
  assert.ok(logs.some((log) => log.entityType === "User" && log.metadata?.passwordReset === true && log.metadata?.sessionsRevoked === true))
  console.log("Master smoke passed: authorization, unique keys, versions, stock/method guards, eligibility, user revocation, settings and audit.")
} finally {
  // Only test fixtures; this script refuses any non-_test database.
  for (const old of originalSettings) {
    await prisma.setting.update({ where: { key: old.key }, data: { value: old.value, updatedAt: old.updatedAt } })
  }
  if (batch) await prisma.stockMovement.deleteMany({ where: { batchId: batch.id } })
  if (batch) await prisma.inventoryBatch.delete({ where: { id: batch.id } })
  if (item) await prisma.transactionItem.delete({ where: { id: item.id } })
  if (inbound) await prisma.transaction.delete({ where: { id: inbound.id } })
  if (product) await prisma.product.delete({ where: { id: product.id } })
  if (location) await prisma.location.delete({ where: { id: location.id } })
  if (supplier) await prisma.supplier.delete({ where: { id: supplier.id } })
  if (category) await prisma.category.delete({ where: { id: category.id } })
  await prisma.activityLog.deleteMany({ where: { userId: { in: actorIds } } })
  await prisma.user.deleteMany({ where: { id: { in: actorIds } } })
  await prisma.$disconnect()
}
