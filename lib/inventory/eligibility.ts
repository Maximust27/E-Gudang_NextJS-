import type { Prisma } from "../../generated/prisma/client.ts"

export type StockMethod = "FIFO" | "FEFO"
export type StockCandidate = { id: number; isActive: boolean; method: StockMethod }

export function eligibleBatchWhere(products: StockCandidate[], today: Date): Prisma.InventoryBatchWhereInput {
  const fifo = products.filter((p) => p.isActive && p.method === "FIFO").map((p) => p.id)
  const fefo = products.filter((p) => p.isActive && p.method === "FEFO").map((p) => p.id)
  return {
    qtyOnHand: { gt: 0 },
    isBlocked: false,
    location: { isActive: true },
    OR: [
      { productId: { in: fifo }, expiryDate: null },
      { productId: { in: fefo }, expiryDate: { gt: today } },
    ],
  }
}

export function batchStatus(batch: { qtyOnHand: number; isBlocked: boolean; expiryDate: Date | null; location: { isActive: boolean } }, product: StockCandidate, today: Date) {
  if (batch.qtyOnHand === 0) return "Habis"
  if (batch.isBlocked) return "Diblokir"
  if (batch.expiryDate && batch.expiryDate <= today) return "Expired"
  if (!product.isActive || !batch.location.isActive) return "Nonaktif"
  if ((product.method === "FEFO") !== !!batch.expiryDate) return "Metadata tidak sesuai"
  return "Tersedia"
}
