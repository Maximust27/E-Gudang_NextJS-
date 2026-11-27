import assert from "node:assert/strict"
import { test } from "node:test"
import { businessDate, effectiveMethod, masterSchema } from "../lib/master/schema.ts"

const product = { kind: "product", id: null, updatedAt: null, name: " Barang ", sku: "0001", cartonBarcode: "001234", categoryId: "1", methodOverride: "DEFAULT", piecesPerCarton: "", minStock: "0", isActive: "active" }

test("master validation keeps codes as strings and normalizes quantities", () => {
  const result = masterSchema.parse(product)
  assert.equal(result.sku, "0001")
  assert.equal(result.cartonBarcode, "001234")
  assert.equal(result.name, "Barang")
  assert.equal(result.minStock, 0)
  assert.equal(result.piecesPerCarton, null)
  assert.equal(result.methodOverride, null)
  assert.equal(result.categoryId, 1)
  assert.equal(result.isActive, true)
})

test("reserved barcode, invalid numbers, stale identity and unexpected status are rejected", () => {
  for (const patch of [{ cartonBarcode: "lot-123" }, { minStock: "-1" }, { minStock: "1.5" }, { minStock: "2147483648" }, { piecesPerCarton: "0" }, { categoryId: "0" }, { id: 1 }, { isActive: "true" }]) {
    assert.equal(masterSchema.safeParse({ ...product, ...patch }).success, false)
  }
})

test("new user needs password while an edit may preserve existing hash", () => {
  const user = { kind: "user", id: null, updatedAt: null, email: " TEST@EXAMPLE.COM ", name: "Test", role: "OPERATOR", isActive: "active", password: "" }
  assert.equal(masterSchema.safeParse(user).success, false)
  assert.equal(masterSchema.parse({ ...user, password: "valid-passphrase-2026" }).email, "test@example.com")
  assert.equal(masterSchema.safeParse({ ...user, id: 1, updatedAt: "2026-11-27T00:00:00.000Z" }).success, true)
})

test("business day rolls at midnight Jakarta and effective method follows override", () => {
  assert.equal(businessDate(new Date("2026-11-26T16:59:59Z")).toISOString(), "2026-11-26T00:00:00.000Z")
  assert.equal(businessDate(new Date("2026-11-26T17:00:00Z")).toISOString(), "2026-11-27T00:00:00.000Z")
  assert.equal(effectiveMethod("FIFO", null), "FIFO")
  assert.equal(effectiveMethod("FIFO", "FEFO"), "FEFO")
})
