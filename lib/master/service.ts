import { hash } from "bcryptjs"
import type { Prisma, PrismaClient } from "../../generated/prisma/client.ts"
import { passwordCost } from "../auth/credentials.ts"
import { effectiveMethod, masterSchema, settingKeys, type MasterCommand } from "./schema.ts"

export class MasterError extends Error {}

type Tx = Prisma.TransactionClient
type Entity = Exclude<MasterCommand, { kind: "general" }>

function reject(message: string): never {
  throw new MasterError(message)
}

function checkVersion(existing: { updatedAt: Date } | null, command: Entity) {
  if (command.id !== null && (!existing || existing.updatedAt.toISOString() !== command.updatedAt)) {
    reject("Data sudah berubah atau tidak ditemukan. Muat ulang halaman.")
  }
}

async function audit(tx: Tx, actorId: number, entityType: string, id: number | string, action: string, metadata: Prisma.InputJsonObject) {
  await tx.activityLog.create({ data: { userId: actorId, entityType, entityId: String(id), action, metadata } })
}

// Product locks are acquired before examining batches. Category changes
// acquire category then product locks in ID order. Future stock writers
// must follow the same product locking contract and re-read master data.
async function checkBatchMethod(tx: Tx, productId: number, method: "FIFO" | "FEFO") {
  const invalid = await tx.inventoryBatch.findFirst({
    where: { productId, expiryDate: method === "FEFO" ? null : { not: null } },
    select: { id: true },
  })
  if (invalid) reject("Metode tidak sesuai dengan histori expiry batch. Rekonsiliasi batch terlebih dahulu.")
}

async function saveCategory(tx: Tx, actorId: number, command: Extract<Entity, { kind: "category" }>) {
  const { id, name, defaultMethod, isActive } = command
  const data = { name, defaultMethod, isActive }
  if (id === null) {
    const row = await tx.category.create({ data })
    await audit(tx, actorId, "Category", row.id, "CREATE", data)
    return
  }
  await tx.$queryRaw`SELECT id FROM categories WHERE id = ${id} FOR UPDATE`
  const previous = await tx.category.findUnique({ where: { id } })
  checkVersion(previous, command)
  await tx.$queryRaw`SELECT id FROM products WHERE category_id = ${id} ORDER BY id FOR UPDATE`
  if (!isActive && await tx.product.count({ where: { categoryId: id, isActive: true } })) {
    reject("Kategori masih memiliki SKU aktif.")
  }
  if (previous?.defaultMethod !== defaultMethod) {
    const products = await tx.product.findMany({
      where: { categoryId: id }, select: { id: true, methodOverride: true }, orderBy: { id: "asc" },
    })
    for (const product of products) {
      if (defaultMethod === "FEFO" && product.methodOverride === "FIFO") {
        reject("Masih ada SKU dengan override FIFO. Ubah metode SKU terlebih dahulu.")
      }
      await checkBatchMethod(tx, product.id, effectiveMethod(defaultMethod, product.methodOverride))
    }
  }
  await tx.category.update({ where: { id }, data })
  await audit(tx, actorId, "Category", id, "UPDATE", data)
}

export async function saveProduct(tx: Tx, actorId: number, command: Extract<Entity, { kind: "product" }>) {
  const { id, sku, name, cartonBarcode, categoryId, methodOverride, piecesPerCarton, minStock, isActive } = command
  const data = { sku, name, cartonBarcode, categoryId, methodOverride, piecesPerCarton, minStock, isActive }
  await tx.$queryRaw`SELECT id FROM categories WHERE id = ${categoryId} FOR UPDATE`
  const category = await tx.category.findUnique({ where: { id: categoryId } })
  if (!category) reject("Kategori tidak ditemukan.")
  if (category.defaultMethod === "FEFO" && methodOverride === "FIFO") reject("Kategori FEFO tidak dapat menggunakan FIFO.")
  if (id === null) {
    if (!category.isActive) reject("Pilih kategori aktif.")
    const row = await tx.product.create({ data })
    await audit(tx, actorId, "Product", row.id, "CREATE", data)
    return
  }
  await tx.$queryRaw`SELECT id FROM products WHERE id = ${id} FOR UPDATE`
  const previous = await tx.product.findUnique({ where: { id } })
  checkVersion(previous, command)
  if (!category.isActive && (isActive || previous?.categoryId !== categoryId)) reject("Pilih kategori aktif.")
  if (!isActive && await tx.inventoryBatch.count({ where: { productId: id, qtyOnHand: { gt: 0 } } })) {
    reject("Barang masih memiliki stok fisik, termasuk stok expired atau diblokir.")
  }
  await checkBatchMethod(tx, id, effectiveMethod(category.defaultMethod, methodOverride))
  await tx.product.update({ where: { id }, data })
  await audit(tx, actorId, "Product", id, "UPDATE", data)
}

async function saveSupplier(tx: Tx, actorId: number, command: Extract<Entity, { kind: "supplier" }>) {
  const { id, name, code, isActive } = command
  const data = { name, code, isActive }
  if (id === null) {
    const row = await tx.supplier.create({ data })
    await audit(tx, actorId, "Supplier", row.id, "CREATE", data)
  } else {
    await tx.$queryRaw`SELECT id FROM suppliers WHERE id = ${id} FOR UPDATE`
    checkVersion(await tx.supplier.findUnique({ where: { id } }), command)
    await tx.supplier.update({ where: { id }, data })
    await audit(tx, actorId, "Supplier", id, "UPDATE", data)
  }
}

async function saveLocation(tx: Tx, actorId: number, command: Extract<Entity, { kind: "location" }>) {
  const { id, name, code, isActive } = command
  const data = { name, code, isActive }
  if (id === null) {
    const row = await tx.location.create({ data })
    await audit(tx, actorId, "Location", row.id, "CREATE", data)
  } else {
    await tx.$queryRaw`SELECT id FROM locations WHERE id = ${id} FOR UPDATE`
    checkVersion(await tx.location.findUnique({ where: { id } }), command)
    if (!isActive && await tx.inventoryBatch.count({ where: { locationId: id, qtyOnHand: { gt: 0 } } })) {
      reject("Lokasi masih memiliki stok fisik.")
    }
    await tx.location.update({ where: { id }, data })
    await audit(tx, actorId, "Location", id, "UPDATE", data)
  }
}

async function saveUser(tx: Tx, actorId: number, command: Extract<Entity, { kind: "user" }>, passwordHash: string | null) {
  const { id, email, name, role, isActive } = command
  const data = { email, name, role, isActive }
  if (id === null) {
    if (!passwordHash) reject("Password wajib diisi.")
    const row = await tx.user.create({ data: { ...data, passwordHash }, select: { id: true } })
    await audit(tx, actorId, "User", row.id, "CREATE", data)
    return
  }
  const previous = await tx.user.findUnique({
    where: { id }, select: { updatedAt: true, role: true, isActive: true, email: true },
  })
  checkVersion(previous, command)
  // The active Admin actor can never deactivate or demote their own account.
  // Actor and target locks below also serialize two admins editing each other.
  if (id === actorId && (!isActive || role !== "ADMIN")) reject("Admin tidak dapat menonaktifkan atau menurunkan role akun sendiri.")
  const revoke = !!passwordHash || previous?.role !== role || previous?.isActive !== isActive || previous?.email !== email
  await tx.user.update({ where: { id }, data: {
    ...data,
    ...(passwordHash ? { passwordHash } : {}),
    ...(revoke ? { sessionVersion: { increment: 1 } } : {}),
  }, select: { id: true } })
  if (passwordHash) await tx.loginRateLimit.deleteMany({ where: { key: "user:" + id } })
  await audit(tx, actorId, "User", id, "UPDATE", { ...data, passwordReset: !!passwordHash, sessionsRevoked: revoke })
}

async function saveGeneral(tx: Tx, actorId: number, command: Extract<MasterCommand, { kind: "general" }>) {
  // Fixed ordering serializes the two settings, and the version check prevents stale edits.
  await tx.$queryRaw`SELECT \`key\` FROM settings WHERE \`key\` IN ('near_expiry_days', 'dead_stock_days') ORDER BY \`key\` FOR UPDATE`
  const fields = [
    { key: settingKeys.deadStockDays, value: command.deadStockDays, version: command.deadVersion },
    { key: settingKeys.nearExpiryDays, value: command.nearExpiryDays, version: command.nearVersion },
  ]
  for (const { key, value, version } of fields) {
    const old = await tx.setting.findUnique({ where: { key } })
    if ((old?.updatedAt.toISOString() ?? null) !== version) reject("Pengaturan sudah berubah. Muat ulang halaman.")
    await tx.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
    await audit(tx, actorId, "Setting", key, "UPDATE", { before: old?.value ?? null, value })
  }
}

// Auth is checked by the server action; DB-level active-role check is repeated
// inside the write transaction. Hash outside locks to keep transactions short.
export async function saveMaster(prisma: PrismaClient, actorId: number, input: unknown) {
  const parsed = masterSchema.safeParse(input)
  if (!parsed.success) reject(parsed.error.issues[0]?.message ?? "Input tidak valid.")
  const command = parsed.data
  const passwordHash = command.kind === "user" && command.password ? await hash(command.password, passwordCost) : null
  await prisma.$transaction(async (tx) => {
    const target = command.kind === "user" ? command.id ?? actorId : actorId
    await tx.$queryRaw`SELECT id FROM users WHERE id IN (${actorId}, ${target}) ORDER BY id FOR UPDATE`
    const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true, isActive: true } })
    if (actor?.role !== "ADMIN" || !actor.isActive) reject("Akses Admin diperlukan.")
    switch (command.kind) {
      case "category": return saveCategory(tx, actorId, command)
      case "product": return saveProduct(tx, actorId, command)
      case "supplier": return saveSupplier(tx, actorId, command)
      case "location": return saveLocation(tx, actorId, command)
      case "user": return saveUser(tx, actorId, command, passwordHash)
      case "general": return saveGeneral(tx, actorId, command)
    }
  }, { isolationLevel: "ReadCommitted" })
}
