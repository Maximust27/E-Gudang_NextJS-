import type { Workbook } from "exceljs"
import { importHeaders, importMaxBytes, importMaxRows, importSheet, type ImportRow } from "./import-schema.ts"

type Category = { name: string; defaultMethod: string; isActive: boolean }

export function fillImportTemplate(workbook: Workbook, categories: Category[]) {
  const sheet = workbook.addWorksheet(importSheet, { views: [{ state: "frozen", ySplit: 1 }] })
  sheet.columns = importHeaders.map((header, index) => ({
    header, key: header, width: [22, 36, 26, 28, 16, 18, 18, 16][index],
    style: index === 5 || index === 6 ? { numFmt: "0" } : { numFmt: "@" },
  }))
  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: "FFFFFFFF" } }
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF171717" } }
  header.height = 25
  sheet.autoFilter = "A1:H1"
  const guide = workbook.addWorksheet("Panduan")
  guide.columns = [{ width: 25 }, { width: 85 }]
  guide.addRows([
    ["Kolom", "Cara mengisi"],
    ["sku", "Wajib teks unik. Contoh: SKU-001. Jangan ubah format sel menjadi angka."],
    ["nama", "Wajib nama barang."],
    ["barcode_karton", "Wajib teks unik. Contoh: 001234567890. Prefix LOT- khusus batch."],
    ["kategori", "Wajib nama kategori aktif yang sama dengan daftar di bawah."],
    ["metode", "DEFAULT (ikuti kategori), FIFO atau FEFO. Kosong = DEFAULT."],
    ["isi_per_karton", "Opsional, bilangan bulat positif."],
    ["minimum_stok", "Bilangan bulat >= 0. Kosong = 0."],
    ["status", "Aktif atau Nonaktif. Kosong = Aktif."],
    ["Batas", "Maksimal 100 baris, file .xlsx maksimal 1 MB. Tanpa formula."],
    ["Import", "Hanya tambah master baru; tidak mengubah stok atau menimpa barang."],
    [],
    ["Kategori aktif", "Metode default"],
    ...categories.filter((category) => category.isActive).map((category) => [category.name, category.defaultMethod]),
  ])
  guide.getRow(1).font = { bold: true }
  guide.getRow(13).font = { bold: true }
  guide.getColumn(2).alignment = { wrapText: true, vertical: "middle" }
}

export function readImportWorkbook(workbook: Workbook): ImportRow[] {
  const sheet = workbook.getWorksheet(importSheet)
  if (!sheet) throw new Error("Sheet Barang tidak ditemukan. Gunakan template E-Gudang.")
  if (sheet.columnCount > importHeaders.length || sheet.rowCount > importMaxRows + 1) {
    throw new Error("Template hanya menerima 8 kolom dan maksimal 100 baris barang.")
  }
  if (!importHeaders.every((header, index) => sheet.getCell(1, index + 1).value === header)) {
    throw new Error("Header tidak sesuai template. Jangan ubah nama atau urutan kolom.")
  }
  const rows: ImportRow[] = []
  for (let index = 2; index <= sheet.rowCount; index++) {
    const values = importHeaders.map((_, column) => {
      const cell = sheet.getCell(index, column + 1)
      if (cell.isMerged) return false as const
      const value = cell.value
      if (value === null || value === undefined) return null
      if (typeof value === "string" && value.length <= 512) return value
      if (typeof value === "number" && Number.isFinite(value)) return value
      return false as const
    })
    if (values.every((value) => value === null || typeof value === "string" && !value.trim())) continue
    rows.push({ row: index, cells: values })
  }
  if (!rows.length) throw new Error("Tidak ada barang untuk diimport.")
  return rows
}

export function checkImportFile(file: { name: string; size: number }) {
  if (!/\.xlsx$/i.test(file.name) || file.size <= 0 || file.size > importMaxBytes) {
    throw new Error("Pilih file .xlsx dengan ukuran maksimal 1 MB.")
  }
}
