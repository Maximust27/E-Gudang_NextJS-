import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requirePermission } from "@/lib/auth/access"
import { getPrisma } from "@/lib/prisma"
import { positiveId } from "@/lib/master/query"
import { encodeBarcode } from "@/lib/barcode/encode"
import { LabelPrint, type LabelData } from "@/components/master/label-print"

export const metadata: Metadata = { title: "Cetak Label" }
type Props = { params: Promise<{ kind: string; id: string }> }

async function PrintContent({ params }: Props) {
  await requirePermission("products:view")
  const { kind, id: rawId } = await params
  const id = positiveId(rawId)
  if (!id || (kind !== "sku" && kind !== "batch")) notFound()
  const prisma = getPrisma()
  let data: LabelData
  if (kind === "sku") {
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true, sku: true, cartonBarcode: true } })
    if (!product) notFound()
    data = { kind: "SKU", productName: product.name, sku: product.sku, code: product.cartonBarcode, productId: product.id }
  } else {
    const batch = await prisma.inventoryBatch.findUnique({ where: { id }, select: {
      internalLotCode: true, expiryDate: true, location: { select: { code: true } },
      product: { select: { id: true, name: true, sku: true } },
    } })
    if (!batch) notFound()
    data = {
      kind: "BATCH", productName: batch.product.name, sku: batch.product.sku,
      code: batch.internalLotCode, productId: batch.product.id, location: batch.location.code,
      expiry: batch.expiryDate?.toISOString().slice(0, 10),
    }
  }
  let bits: string | null = null
  let error: string | null = null
  try {
    bits = encodeBarcode(data.code)
  } catch {
    error = "Kode tidak dapat dicetak sebagai Code 128. Periksa format barcode tersimpan."
  }
  return <LabelPrint data={data} bits={bits} error={error} />
}

export default function Page(props: Props) {
  return <Suspense fallback={<p role="status" className="p-4 type-body text-muted-foreground">Memuat label...</p>}><PrintContent {...props} /></Suspense>
}
