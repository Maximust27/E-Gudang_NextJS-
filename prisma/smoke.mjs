import "dotenv/config"
import assert from "node:assert/strict"
import { createHash, randomUUID } from "node:crypto"
import { createPrismaClient, parseDatabaseUrl } from "../lib/db-client.ts"

// Never run fixture mutations against an operational database.
const options = parseDatabaseUrl(process.env.DATABASE_URL)
if (!options.database.endsWith("_test")) {
  throw new Error("Database smoke test requires a separate database ending in _test")
}

const prisma = createPrismaClient()
const marker = randomUUID()
const sku = "TEST-" + marker
const inboundNumber = "IN-" + marker
const receivedAt = new Date("2026-11-26T02:00:00.000Z")
const expiryDate = new Date("2030-12-20T00:00:00.000Z")
const rollback = new Error("Intentional fixture rollback")

try {
  const [session] = await prisma.$queryRaw`SELECT @@session.time_zone AS tz`
  assert.equal(session.tz, "+00:00")
  assert.equal(await prisma.setting.count({ where: { key: { in: ["near_expiry_days", "dead_stock_days"] } } }), 2)
  await assert.rejects(
    prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: {
        email: marker + "@example.invalid",
        passwordHash: "TEST_ONLY_NOT_A_CREDENTIAL",
        name: "Test operator",
        role: "OPERATOR",
        isActive: false,
      } })
      const category = await tx.category.create({ data: { name: sku, defaultMethod: "FEFO" } })
      const supplier = await tx.supplier.create({ data: { name: sku, code: sku } })
      const location = await tx.location.create({ data: { name: sku, code: sku } })
      const productData = { sku, cartonBarcode: "00" + marker, name: "Test product", categoryId: category.id }
      const product = await tx.product.create({ data: productData })
      assert.equal(product.cartonBarcode, "00" + marker)

      // Unique barcode and namespace guard.
      await assert.rejects(tx.product.create({ data: { ...productData, sku: sku + "-2" } }))
      await assert.rejects(tx.product.create({ data: { ...productData, sku: sku + "-3", cartonBarcode: "LOT-" + marker } }))
      await assert.rejects(tx.product.update({ where: { id: product.id }, data: { minStock: -1 } }))

      const posting = {
        number: inboundNumber,
        type: "IN",
        status: "POSTED",
        supplierId: supplier.id,
        userId: user.id,
        receivedAt,
        postedAt: receivedAt,
        idempotencyKey: marker,
        payloadHash: createHash("sha256").update(marker).digest("hex"),
      }
      const inbound = await tx.transaction.create({ data: posting })
      await assert.rejects(tx.transaction.create({ data: { ...posting, number: inboundNumber + "-retry" } }))
      const item = await tx.transactionItem.create({ data: { transactionId: inbound.id, productId: product.id, quantity: 10 } })
      await assert.rejects(tx.transactionItem.create({ data: { transactionId: inbound.id, productId: product.id, quantity: 0 } }))
      const batch = await tx.inventoryBatch.create({ data: {
        productId: product.id,
        locationId: location.id,
        receiptItemId: item.id,
        internalLotCode: "LOT-" + marker,
        receivedAt,
        expiryDate,
        qtyOnHand: 10,
      } })
      const movement = { transactionItemId: item.id, batchId: batch.id, signedDelta: 10, qtyBefore: 0, qtyAfter: 10 }
      await tx.stockMovement.create({ data: movement })
      await assert.rejects(tx.stockMovement.create({ data: movement }))
      await assert.rejects(tx.inventoryBatch.update({ where: { id: batch.id }, data: { qtyOnHand: -1 } }))
      await assert.rejects(tx.inventoryBatch.update({ where: { id: batch.id }, data: { isBlocked: true } }))
      const stored = await tx.inventoryBatch.findUniqueOrThrow({ where: { id: batch.id } })
      assert.equal(stored.qtyOnHand, 10)
      assert.equal(stored.receivedAt.toISOString(), receivedAt.toISOString())
      assert.equal(stored.expiryDate?.toISOString(), expiryDate.toISOString())

      const opname = await tx.stockOpname.create({ data: { number: "SO-" + marker, createdById: user.id } })
      const countData = { opnameId: opname.id, batchId: batch.id, snapshotQty: 10, snapshotVersion: batch.version, countedQty: 0 }
      await assert.rejects(tx.stockOpnameItem.create({ data: countData }))
      await tx.stockOpnameItem.create({ data: { ...countData, reason: "Test difference" } })
      await assert.rejects(tx.stockOpnameItem.create({ data: { ...countData, reason: "Duplicate count" } }))
      await assert.rejects(tx.category.delete({ where: { id: category.id } }))
      throw rollback
    }, { timeout: 30000 }),
    (error) => error === rollback
  )
  assert.equal(await prisma.product.count({ where: { sku } }), 0)
  assert.equal(await prisma.transaction.count({ where: { number: inboundNumber } }), 0)
  console.log("Database smoke test passed: adapter, UTC, seed, constraints, relations and rollback.")
} finally {
  await prisma.$disconnect()
}
