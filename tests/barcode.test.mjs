import assert from "node:assert/strict"
import { test } from "node:test"
import { barcodeFits, barcodeRuns, barcodeWidthMm, encodeBarcode, labelQuietModules, parseCopies } from "../lib/barcode/encode.ts"

test("Code 128 generates deterministic encodings for exact SKU and lot codes", () => {
  const code = "001234567890"
  const bits = encodeBarcode(code)
  assert.match(bits, /^[01]+$/)
  assert.equal(encodeBarcode(code), bits)
  assert.notEqual(encodeBarcode("1234567890"), bits)
  assert.match(encodeBarcode("LOT-123456789"), /^[01]+$/)
  assert.equal(barcodeFits(bits, 90), true)
  const runs = barcodeRuns(bits)
  assert.equal(runs[0].x, labelQuietModules)
  assert.equal(runs.reduce((sum, run) => sum + run.width, 0), [...bits].filter((bit) => bit === "1").length)
  assert.equal(barcodeWidthMm(bits), (bits.length + 20) * 0.25)
})

test("invalid Code 128 text, dense symbols and out-of-range copies are rejected", () => {
  for (const value of ["", "汉字", "SKU\n1", "A".repeat(129)]) assert.throws(() => encodeBarcode(value))
  const wide = encodeBarcode("A".repeat(40))
  assert.equal(barcodeFits(wide, 90), false)
  assert.equal(barcodeFits(wide, 180), true)
  const dense = encodeBarcode("A".repeat(128))
  assert.equal(barcodeFits(dense, 180), false)
  assert.equal(parseCopies("1"), 1)
  assert.equal(parseCopies("40"), 40)
  for (const value of ["", "0", "41", "2.5", "-1"]) assert.equal(parseCopies(value), null)
})
