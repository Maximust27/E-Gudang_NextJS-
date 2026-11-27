import "server-only"
import type { Prisma } from "@/generated/prisma/client"
import { getPrisma } from "@/lib/prisma"
import { roleLabels } from "@/lib/permissions"
import { eligibleBatchWhere } from "@/lib/inventory/eligibility"
import { businessDate, effectiveMethod, settingKeys } from "./schema"
import { literalSearch, pageWindow, type ListQuery } from "./query"
import type { CategoryOption, GeneralValues, MasterList, MasterRow } from "./types"

const statusValue = (active: boolean) => active ? "active" : "inactive"
const formatNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value)
const identity = (row: { id: number; updatedAt: Date; name: string; isActive: boolean }) => ({
  id: row.id, updatedAt: row.updatedAt.toISOString(), name: row.name, isActive: row.isActive,
})
const activeFilter = (query: ListQuery) => query.status === "all" ? undefined : query.status === "active"
const nameDirection = (query: ListQuery) => query.sort === "name-desc" ? "desc" as const : "asc" as const
const orderByName = (query: ListQuery) => query.sort === "newest"
  ? [{ updatedAt: "desc" as const }, { id: "desc" as const }]
  : [{ name: nameDirection(query) }, { id: "asc" as const }]

export function readCategoryOptions(): Promise<CategoryOption[]> {
  return getPrisma().category.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true, isActive: true, defaultMethod: true },
  })
}

async function readProducts(query: ListQuery): Promise<MasterList> {
  const prisma = getPrisma()
  const contains = literalSearch(query.q)
  const where: Prisma.ProductWhereInput = {
    isActive: activeFilter(query),
    categoryId: query.categoryId ?? undefined,
    AND: [
      ...(query.q ? [{ OR: [{ name: { contains } }, { sku: { contains } }, { cartonBarcode: { contains } }] }] : []),
      ...(query.method !== "all" ? [{ OR: [
        { methodOverride: query.method },
        { methodOverride: null, category: { defaultMethod: query.method } },
      ] }] : []),
    ],
  }
  const window = pageWindow(await prisma.product.count({ where }), query.page)
  const records = await prisma.product.findMany({
    where, skip: window.skip, take: window.take,
    orderBy: query.sort === "code-asc" ? [{ sku: "asc" }, { id: "asc" }] : orderByName(query),
    include: { category: { select: { name: true, defaultMethod: true } } },
  })
  const candidates = records.map((row) => ({ id: row.id, isActive: row.isActive, method: effectiveMethod(row.category.defaultMethod, row.methodOverride) }))
  const sums = candidates.length ? await prisma.inventoryBatch.groupBy({
    by: ["productId"],
    where: eligibleBatchWhere(candidates, businessDate()),
    _sum: { qtyOnHand: true },
    orderBy: { productId: "asc" },
  }) : []
  const stock = new Map(sums.map((row) => [row.productId, row._sum.qtyOnHand ?? 0]))
  return {
    ...window,
    rows: records.map((row): MasterRow => ({
      ...identity(row), secondary: row.sku,
      cells: [row.category.name, formatNumber(stock.get(row.id) ?? 0), effectiveMethod(row.category.defaultMethod, row.methodOverride)],
      values: {
        name: row.name, sku: row.sku, cartonBarcode: row.cartonBarcode, categoryId: String(row.categoryId),
        methodOverride: row.methodOverride ?? "DEFAULT", piecesPerCarton: row.piecesPerCarton === null ? "" : String(row.piecesPerCarton),
        minStock: String(row.minStock), isActive: statusValue(row.isActive),
      },
    })),
  }
}

export async function readMasterList(kind: "category" | "supplier" | "location" | "user" | "product", query: ListQuery): Promise<MasterList> {
  if (kind === "product") return readProducts(query)
  const prisma = getPrisma()
  const contains = literalSearch(query.q)
  const active = activeFilter(query)
  const orderBy = orderByName(query)

  if (kind === "category") {
    const where = { isActive: active, name: query.q ? { contains } : undefined }
    const window = pageWindow(await prisma.category.count({ where }), query.page)
    const records = await prisma.category.findMany({ where, orderBy, skip: window.skip, take: window.take, include: { _count: { select: { products: true } } } })
    return { ...window, rows: records.map((row) => ({
      ...identity(row), cells: [row.defaultMethod, formatNumber(row._count.products)],
      values: { name: row.name, defaultMethod: row.defaultMethod, isActive: statusValue(row.isActive) },
    })) }
  }
  if (kind === "user") {
    const where = { isActive: active, OR: query.q ? [{ name: { contains } }, { email: { contains } }] : undefined }
    const window = pageWindow(await prisma.user.count({ where }), query.page)
    const records = await prisma.user.findMany({
      where, orderBy, skip: window.skip, take: window.take,
      select: { id: true, updatedAt: true, name: true, email: true, role: true, isActive: true },
    })
    return { ...window, rows: records.map((row) => ({
      ...identity(row), secondary: row.email, cells: [roleLabels[row.role]],
      values: { name: row.name, email: row.email, role: row.role, isActive: statusValue(row.isActive), password: "" },
    })) }
  }
  const where = { isActive: active, OR: query.q ? [{ name: { contains } }, { code: { contains } }] : undefined }
  const sort = query.sort === "code-asc" ? [{ code: "asc" as const }, { id: "asc" as const }] : orderBy
  if (kind === "supplier") {
    const window = pageWindow(await prisma.supplier.count({ where }), query.page)
    const records = await prisma.supplier.findMany({ where, orderBy: sort, skip: window.skip, take: window.take })
    return { ...window, rows: records.map((row) => ({
      ...identity(row), cells: [row.code ?? "—"],
      values: { name: row.name, code: row.code ?? "", isActive: statusValue(row.isActive) },
    })) }
  }
  const window = pageWindow(await prisma.location.count({ where }), query.page)
  const records = await prisma.location.findMany({ where, orderBy: sort, skip: window.skip, take: window.take })
  return { ...window, rows: records.map((row) => ({
    ...identity(row), cells: [row.code],
    values: { name: row.name, code: row.code, isActive: statusValue(row.isActive) },
  })) }
}

export async function readGeneral(): Promise<GeneralValues> {
  const rows = await getPrisma().setting.findMany({ where: { key: { in: Object.values(settingKeys) } } })
  const near = rows.find((row) => row.key === settingKeys.nearExpiryDays)
  const dead = rows.find((row) => row.key === settingKeys.deadStockDays)
  return {
    nearExpiryDays: String(near?.value ?? 30), deadStockDays: String(dead?.value ?? 60),
    nearVersion: near?.updatedAt.toISOString() ?? null, deadVersion: dead?.updatedAt.toISOString() ?? null,
  }
}

const auditFields = ["name", "sku", "cartonBarcode", "categoryId", "methodOverride", "piecesPerCarton", "minStock", "defaultMethod", "isActive", "code", "email", "role", "passwordReset", "sessionsRevoked", "before", "value"]
function safeAuditMetadata(value: Prisma.JsonValue): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return Object.fromEntries(auditFields.flatMap((key) => {
    const field = value[key]
    return field === null || ["string", "number", "boolean"].includes(typeof field)
      ? [[key, field as string | number | boolean | null]] : []
  }))
}
export async function readAudit(query: ListQuery) {
  const prisma = getPrisma()
  const contains = literalSearch(query.q)
  const where: Prisma.ActivityLogWhereInput = query.q ? { OR: [
    { action: { contains } }, { entityType: { contains } }, { entityId: { contains } },
    { user: { name: { contains } } },
  ] } : {}
  const window = pageWindow(await prisma.activityLog.count({ where }), query.page)
  const logs = await prisma.activityLog.findMany({
    where, skip: window.skip, take: window.take, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, createdAt: true, action: true, entityType: true, entityId: true, metadata: true, user: { select: { name: true } } },
  })
  return { ...window, rows: logs.map((row) => ({ ...row, metadata: safeAuditMetadata(row.metadata) })) }
}

export async function readProductDetail(id: number, requestedPage: number) {
  const prisma = getPrisma()
  const product = await prisma.product.findUnique({ where: { id }, include: { category: { select: { name: true, defaultMethod: true } } } })
  if (!product) return null
  const today = businessDate()
  const candidate = { id, isActive: product.isActive, method: effectiveMethod(product.category.defaultMethod, product.methodOverride) }
  const where = { productId: id }
  const [count, physical, available, movements] = await Promise.all([
    prisma.inventoryBatch.count({ where }),
    prisma.inventoryBatch.aggregate({ where, _sum: { qtyOnHand: true } }),
    prisma.inventoryBatch.aggregate({ where: eligibleBatchWhere([candidate], today), _sum: { qtyOnHand: true } }),
    prisma.stockMovement.findMany({
      where: { batch: { productId: id } }, take: 20, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, createdAt: true, signedDelta: true, qtyBefore: true, qtyAfter: true, batch: { select: { internalLotCode: true } },
        transactionItem: { select: { transaction: { select: { number: true, type: true } } } } },
    }),
  ])
  const window = pageWindow(count, requestedPage)
  const batches = await prisma.inventoryBatch.findMany({
    where, skip: window.skip, take: window.take, orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
    include: { location: { select: { code: true, name: true, isActive: true } } },
  })
  return { product, candidate, today, physical: physical._sum.qtyOnHand ?? 0, available: available._sum.qtyOnHand ?? 0, movements, batches, ...window }
}
