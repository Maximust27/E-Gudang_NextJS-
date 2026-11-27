import { z } from "zod"
import { masterSchema, type MasterCommand } from "./schema.ts"

export const importMaxRows = 100
export const importMaxBytes = 1024 * 1024
export const importSheet = "Barang"
export const importHeaders = ["sku", "nama", "barcode_karton", "kategori", "metode", "isi_per_karton", "minimum_stok", "status"] as const

// Numeric cells are retained as numbers, never silently converted to SKU/barcode.
// An invalid marker represents a formula, error, date, rich text or unsupported cell.
const cellSchema = z.union([z.string().max(512), z.number().finite(), z.null(), z.literal(false)])
const rowSchema = z.object({
  row: z.number().int().min(2).max(importMaxRows + 1),
  cells: z.array(cellSchema).length(importHeaders.length),
}).strict()
export const importRowsSchema = z.array(rowSchema).min(1, "Tidak ada baris barang.").max(importMaxRows).refine(
  (rows) => rows.every((row, index) => index === 0 || row.row > rows[index - 1].row),
  "Nomor baris harus unik dan berurutan.",
)
export type ImportRow = z.infer<typeof rowSchema>
export type ProductCommand = Extract<MasterCommand, { kind: "product" }>
export type ImportPreviewRow = {
  row: number
  sku: string
  name: string
  barcode: string
  category: string
  method: string
  piecesPerCarton: string
  minStock: string
  status: string
  issues: string[]
}
export type ImportPreview = { rows: ImportPreviewRow[]; valid: number; invalid: number; fingerprint: string | null }

const display = (value: ImportRow["cells"][number]) => typeof value === "string" || typeof value === "number" ? String(value) : ""
const numericText = (value: ImportRow["cells"][number], fallback = "") => value === null || value === "" ? fallback : display(value)

export function readImportRow(row: ImportRow) {
  const [sku, name, barcode, category, method, pieces, minimum, status] = row.cells
  const issues: string[] = []
  row.cells.forEach((cell, index) => {
    if (cell === false) issues.push(importHeaders[index] + ": gunakan nilai biasa, bukan formula/format yang tidak didukung.")
  })
  for (const [key, value] of [["sku", sku], ["barcode_karton", barcode], ["nama", name], ["kategori", category]] as const) {
    if (typeof value !== "string" || !value.trim()) issues.push(key + ": wajib berupa teks. Untuk SKU/barcode, jangan gunakan sel angka.")
  }
  const methodValue = display(method).trim().toUpperCase() || "DEFAULT"
  const statusValue = display(status).trim().toLowerCase() || "aktif"
  const draft = {
    kind: "product" as const, id: null, updatedAt: null,
    sku: display(sku), name: display(name), cartonBarcode: display(barcode),
    categoryId: "1", methodOverride: methodValue, piecesPerCarton: numericText(pieces),
    minStock: numericText(minimum, "0"),
    isActive: statusValue === "aktif" ? "active" : statusValue === "nonaktif" ? "inactive" : statusValue,
  }
  const parsed = masterSchema.safeParse(draft)
  if (!parsed.success) {
    issues.push(...parsed.error.issues.map((issue) => issue.path.join(".") + ": " + issue.message))
  }
  const preview: ImportPreviewRow = {
    row: row.row, sku: display(sku).trim(), name: display(name).trim(), barcode: display(barcode).trim(),
    category: display(category).trim(), method: methodValue, piecesPerCarton: draft.piecesPerCarton,
    minStock: draft.minStock, status: draft.isActive === "active" ? "Aktif" : draft.isActive === "inactive" ? "Nonaktif" : statusValue, issues,
  }
  return { preview, draft, command: parsed.success && parsed.data.kind === "product" && !issues.length ? parsed.data : null }
}
