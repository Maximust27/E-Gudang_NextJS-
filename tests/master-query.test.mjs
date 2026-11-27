import assert from "node:assert/strict"
import { test } from "node:test"
import { parseListQuery, pageWindow, literalSearch, listHref } from "../lib/master/query.ts"
import { batchStatus, eligibleBatchWhere } from "../lib/inventory/eligibility.ts"

test("query validation bounds parameters and ignores repeated values", () => {
  const query = parseListQuery({ q: "  0001  ", page: "999", status: "active", method: "FEFO", category: "2", sort: "code-asc" })
  assert.equal(query.q, "0001")
  assert.equal(query.categoryId, 2)
  assert.deepEqual(pageWindow(41, query.page), { total: 41, pages: 3, page: 3, skip: 40, take: 20 })
  assert.equal(parseListQuery({ page: "-1", category: "1.5", q: ["a", "b"], tab: "invalid" }).page, 1)
  assert.equal(parseListQuery({ category: "2147483648" }).categoryId, null)
  assert.equal(parseListQuery({ category: "all" }).categoryId, null)
  assert.equal(parseListQuery({ category: "" }).categoryId, null)
  assert.equal(literalSearch("a%_b\\c"), "a\\%\\_b\\\\c")
  assert.equal(listHref("/data-barang", query, 2), "/data-barang?q=0001&status=active&method=FEFO&category=2&sort=code-asc&page=2")
})

test("eligible batches distinguish physical and available stock", () => {
  const today = new Date("2026-11-27T00:00:00.000Z")
  const future = new Date("2026-11-28T00:00:00.000Z")
  const product = { id: 1, isActive: true, method: "FEFO" }
  const batch = { qtyOnHand: 3, isBlocked: false, expiryDate: future, location: { isActive: true } }
  assert.equal(batchStatus(batch, product, today), "Tersedia")
  assert.equal(batchStatus({ ...batch, expiryDate: today }, product, today), "Expired")
  assert.equal(batchStatus({ ...batch, isBlocked: true }, product, today), "Diblokir")
  assert.equal(batchStatus({ ...batch, qtyOnHand: 0 }, product, today), "Habis")
  assert.equal(batchStatus({ ...batch, expiryDate: null }, product, today), "Metadata tidak sesuai")
  assert.equal(batchStatus(batch, { ...product, method: "FIFO" }, today), "Metadata tidak sesuai")
  assert.equal(batchStatus(batch, { ...product, isActive: false }, today), "Nonaktif")
  const where = eligibleBatchWhere([product, { id: 2, isActive: true, method: "FIFO" }, { id: 3, isActive: false, method: "FIFO" }], today)
  assert.deepEqual(where.OR, [{ productId: { in: [2] }, expiryDate: null }, { productId: { in: [1] }, expiryDate: { gt: today } }])
})
