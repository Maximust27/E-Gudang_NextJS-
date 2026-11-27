import { createHash } from "node:crypto"
import type { Prisma, PrismaClient } from "../../generated/prisma/client.ts"
import { duplicateKey, importRowsSchema, readImportRow, type ImportPreview, type ImportRow, type ProductCommand } from "./import-schema.ts"
import { effectiveMethod, masterSchema } from "./schema.ts"
import { MasterError, saveProduct } from "./service.ts"

type Reader = Pick<Prisma.TransactionClient, "category" | "product">

async function analyze(reader: Reader, rows: ImportRow[]) {
  const entries = rows.map(readImportRow)
  const skuCounts = new Map<string, number>()
  const barcodeCounts = new Map<string, number>()
  for (const { preview } of entries) {
    for (const [key, counts] of [[duplicateKey(preview.sku), skuCounts], [duplicateKey(preview.barcode), barcodeCounts]] as const) {
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  const categoryNames = [...new Set(entries.map((entry) => entry.preview.category).filter(Boolean))]
  const categories = new Map(await Promise.all(categoryNames.map(async (name) => [
    name, await reader.category.findUnique({ where: { name }, select: { id: true, name: true, defaultMethod: true, isActive: true, updatedAt: true } }),
  ] as const)))
  const commands: ProductCommand[] = []
  const snapshot: unknown[] = []

  // Bounded by 100 rows. Queries use DB collation/unique indexes; do not
  // load the entire product catalog or use approximate client duplicates alone.
  for (const { preview, draft, command } of entries) {
    const category = categories.get(preview.category)
    if (!category?.isActive) preview.issues.push("Kategori tidak ditemukan atau nonaktif.")
    if (category?.defaultMethod === "FEFO" && draft.methodOverride === "FIFO") preview.issues.push("Kategori FEFO tidak dapat menggunakan FIFO.")
    if ((skuCounts.get(duplicateKey(preview.sku)) ?? 0) > 1) preview.issues.push("SKU duplikat di file.")
    if ((barcodeCounts.get(duplicateKey(preview.barcode)) ?? 0) > 1) preview.issues.push("Barcode duplikat di file.")
    if (command) {
      const [sku, barcode] = await Promise.all([
        reader.product.findUnique({ where: { sku: command.sku }, select: { id: true } }),
        reader.product.findUnique({ where: { cartonBarcode: command.cartonBarcode }, select: { id: true } }),
      ])
      if (sku) preview.issues.push("SKU sudah terdaftar.")
      if (barcode) preview.issues.push("Barcode sudah terdaftar.")
      if (category?.isActive && !preview.issues.length) {
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
