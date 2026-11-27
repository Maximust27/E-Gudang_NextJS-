import { createHash } from "node:crypto"
import { Prisma, type PrismaClient } from "../../generated/prisma/client.ts"
import { importRowsSchema, readImportRow, type ImportPreview, type ImportRow, type ProductCommand } from "./import-schema.ts"
import { effectiveMethod, masterSchema } from "./schema.ts"
import { MasterError, saveProduct } from "./service.ts"

type Reader = Pick<Prisma.TransactionClient, "category" | "$queryRaw">

// Use exactly the inventory migration's utf8mb4_unicode_ci collation for
// both file-internal and stored duplicate checks. All values are parameters.
async function findDuplicates(reader: Reader, entries: ReturnType<typeof readImportRow>[]) {
  const selects = entries.map(({ preview }) => Prisma.sql`
    SELECT CAST(${preview.row} AS UNSIGNED) AS row_no,
      CONVERT(${preview.sku} USING utf8mb4) COLLATE utf8mb4_unicode_ci AS sku,
      CONVERT(${preview.barcode} USING utf8mb4) COLLATE utf8mb4_unicode_ci AS barcode
  `)
  const rows = await reader.$queryRaw<Array<{
    rowNumber: number | bigint
    duplicateSku: number | bigint | boolean
    duplicateBarcode: number | bigint | boolean
    existingSku: number | bigint | boolean
    existingBarcode: number | bigint | boolean
  }>>(Prisma.sql`
    WITH input_rows AS (${Prisma.join(selects, " UNION ALL ")})
    SELECT i.row_no AS rowNumber,
      EXISTS(SELECT 1 FROM input_rows j WHERE j.row_no <> i.row_no AND i.sku <> '' AND j.sku = i.sku) AS duplicateSku,
      EXISTS(SELECT 1 FROM input_rows j WHERE j.row_no <> i.row_no AND i.barcode <> '' AND j.barcode = i.barcode) AS duplicateBarcode,
      EXISTS(SELECT 1 FROM products p WHERE p.sku = i.sku) AS existingSku,
      EXISTS(SELECT 1 FROM products p WHERE p.carton_barcode = i.barcode) AS existingBarcode
    FROM input_rows i
  `)
  return new Map(rows.map((row) => [Number(row.rowNumber), row]))
}

async function analyze(reader: Reader, rows: ImportRow[]) {
  const entries = rows.map(readImportRow)
  const duplicates = await findDuplicates(reader, entries)
  const categoryNames = [...new Set(entries.map((entry) => entry.preview.category).filter(Boolean))]
  const categories = new Map(await Promise.all(categoryNames.map(async (name) => [
    name, await reader.category.findUnique({ where: { name }, select: { id: true, name: true, defaultMethod: true, isActive: true, updatedAt: true } }),
  ] as const)))
  const commands: ProductCommand[] = []
  const snapshot: unknown[] = []

  // Bounded by 100 rows. Never load the entire product catalog.
  for (const { preview, draft, command } of entries) {
    const category = categories.get(preview.category)
    if (!category?.isActive) preview.issues.push("Kategori tidak ditemukan atau nonaktif.")
    if (category?.defaultMethod === "FEFO" && draft.methodOverride === "FIFO") preview.issues.push("Kategori FEFO tidak dapat menggunakan FIFO.")
    const duplicate = duplicates.get(preview.row)
    if (!duplicate) throw new MasterError("Pemeriksaan duplikat tidak lengkap.")
    if (duplicate.duplicateSku) preview.issues.push("SKU duplikat di file.")
    if (duplicate.duplicateBarcode) preview.issues.push("Barcode duplikat di file.")
    if (duplicate.existingSku) preview.issues.push("SKU sudah terdaftar.")
    if (duplicate.existingBarcode) preview.issues.push("Barcode sudah terdaftar.")
    if (command) {
      if (category?.isActive && !preview.issues.length) {
        preview.category = category.name
        const parsed = masterSchema.parse({ ...draft, categoryId: String(category.id) })
        if (parsed.kind !== "product") throw new MasterError("Data import tidak valid.")
        commands.push(parsed)
        preview.method = effectiveMethod(category.defaultMethod, parsed.methodOverride)
        snapshot.push({ command: parsed, category: { id: category.id, name: category.name, method: category.defaultMethod, updatedAt: category.updatedAt.toISOString() } })
      }
    }
  }
  const result: ImportPreview = {
    rows: entries.map((entry) => entry.preview),
    valid: commands.length,
    invalid: rows.length - commands.length,
    fingerprint: commands.length === rows.length
      ? createHash("sha256").update(JSON.stringify(snapshot)).digest("hex") : null,
  }
  return { result, commands }
}

function parseRows(input: unknown) {
  const parsed = importRowsSchema.safeParse(input)
  if (!parsed.success) throw new MasterError("Format atau jumlah baris import tidak valid.")
  return parsed.data
}

export async function previewProductImport(prisma: PrismaClient, input: unknown) {
  return (await analyze(prisma, parseRows(input))).result
}

export async function commitProductImport(prisma: PrismaClient, actorId: number, input: unknown, fingerprint: string) {
  const rows = parseRows(input)
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) throw new MasterError("Preview tidak valid. Ulangi pemeriksaan.")
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${actorId} FOR UPDATE`
    const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true, isActive: true } })
    if (actor?.role !== "ADMIN" || !actor.isActive) throw new MasterError("Akses Admin diperlukan.")

    // Lock all resolved category references before product creation, in ID order.
    const initial = await analyze(tx, rows)
    if (initial.result.fingerprint !== fingerprint) throw new MasterError("Data berubah atau terdapat kesalahan. Periksa ulang preview.")
    const ids = [...new Set(initial.commands.map((command) => command.categoryId))].sort((a, b) => a - b)
    for (const id of ids) await tx.$queryRaw`SELECT id FROM categories WHERE id = ${id} FOR UPDATE`
    const { result, commands } = await analyze(tx, rows)
    if (result.fingerprint !== fingerprint) throw new MasterError("Data berubah. Periksa ulang preview.")
    // Reuse existing product invariant and audit logic. Unique conflicts roll
    // back the entire import, including already created rows and audit entries.
    for (const command of commands) await saveProduct(tx, actorId, command)
    return commands.length
  }, { isolationLevel: "ReadCommitted", timeout: 30_000 })
}
