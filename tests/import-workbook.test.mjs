import assert from "node:assert/strict"
import { test } from "node:test"
import ExcelJS from "exceljs"
import { fillImportTemplate, readImportWorkbook, checkImportFile } from "../lib/master/import-workbook.ts"
import { importHeaders, importRowsSchema, readImportRow } from "../lib/master/import-schema.ts"

const categories = [{ name: "Barang umum", isActive: true, defaultMethod: "FIFO" }]
const valid = ["0001", "Barang A", "00123456789", "Barang umum", "DEFAULT", 12, 3, "Aktif"]

test("xlsx template round trip keeps codes as text and normalizes master fields", async () => {
  const workbook = new ExcelJS.Workbook()
  fillImportTemplate(workbook, categories)
  const sheet = workbook.getWorksheet("Barang")
  assert.equal(sheet.getColumn(1).numFmt, "@")
  assert.equal(sheet.getColumn(3).numFmt, "@")
  sheet.addRow(valid)
  const loaded = new ExcelJS.Workbook()
  await loaded.xlsx.load(await workbook.xlsx.writeBuffer())
  const rows = readImportWorkbook(loaded)
  assert.equal(rows.length, 1)
  assert.deepEqual(rows[0].cells, valid)
  assert.ok(importRowsSchema.safeParse(rows).success)
  const { command, preview } = readImportRow(rows[0])
  assert.equal(command.sku, "0001")
  assert.equal(command.cartonBarcode, "00123456789")
  assert.equal(command.piecesPerCarton, 12)
  assert.equal(command.minStock, 3)
  assert.equal(command.methodOverride, null)
  assert.deepEqual(preview.issues, [])
})

test("numeric identifiers, formula, reserved prefix and invalid quantities fail by row", () => {
  const workbook = new ExcelJS.Workbook()
  fillImportTemplate(workbook, categories)
  const sheet = workbook.getWorksheet("Barang")
  sheet.addRow([1, "Barang A", 12345, "Barang umum", "FIFO", null, -1, "Aktif"])
  sheet.addRow(["SKU-2", { formula: '="Barang B"', result: "Barang B" }, "LOT-123", "Barang umum", "FEFO", 0, 3, "Aktif"])
  const rows = readImportWorkbook(workbook)
  assert.equal(rows[1].cells[1], false)
  for (const row of rows) {
    assert.equal(readImportRow(row).command, null)
    assert.ok(readImportRow(row).preview.issues.length >= 2)
  }
})

test("invalid workbook shape, row order and oversized uploads are rejected", () => {
  const workbook = new ExcelJS.Workbook()
  assert.throws(() => readImportWorkbook(workbook), /Sheet Barang/)
  const sheet = workbook.addWorksheet("Barang")
  sheet.addRow([...importHeaders].reverse())
  assert.throws(() => readImportWorkbook(workbook), /Header/)
  sheet.getRow(1).values = [...importHeaders]
  assert.throws(() => readImportWorkbook(workbook), /Tidak ada barang/)
  sheet.getRow(102).values = valid
  assert.throws(() => readImportWorkbook(workbook), /maksimal 100/)
  assert.throws(() => checkImportFile({ name: "data.xls", size: 100 }))
  assert.throws(() => checkImportFile({ name: "data.xlsx", size: 1024 * 1024 + 1 }))
  assert.doesNotThrow(() => checkImportFile({ name: "data.XLSX", size: 1024 }))
  assert.equal(importRowsSchema.safeParse([{ row: 2, cells: valid }, { row: 2, cells: valid }]).success, false)
  assert.equal(importRowsSchema.safeParse([{ row: 2, cells: valid.slice(0, 7) }]).success, false)
})
