import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"
import { PageContainer } from "@/components/shared/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ListPagination } from "@/components/master/list-controls"
import { requirePermission } from "@/lib/auth/access"
import { readProductDetail } from "@/lib/master/read"
import { positiveId, parseListQuery, type SearchParams } from "@/lib/master/query"
import { batchStatus } from "@/lib/inventory/eligibility"

export const metadata: Metadata = { title: "Detail Barang" }
const number = (value: number) => value.toLocaleString("id-ID")
const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" })
const dateOnly = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "UTC" })
const time = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })
type Props = { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }

async function ProductDetail({ params, searchParams }: Props) {
  await requirePermission("products:view")
  const id = positiveId((await params).id)
  if (!id) notFound()
  const detail = await readProductDetail(id, parseListQuery(await searchParams).page)
  if (!detail) notFound()
  const { product, candidate, today } = detail
  const items = [
    ["SKU", product.sku], ["Barcode karton", product.cartonBarcode], ["Kategori", product.category.name],
    ["Metode", candidate.method], ["Isi per karton", product.piecesPerCarton === null ? "—" : number(product.piecesPerCarton) + " pcs"],
    ["Minimum stok", number(product.minStock) + " CTN"],
  ]

  return (
    <PageContainer>
      <div><Button asChild variant="ghost" size="sm"><Link href="/data-barang"><ArrowLeft aria-hidden="true" />Data Barang</Link></Button></div>
      <PageHeader title={product.name} description={"Detail barang · " + product.sku}
        actions={<Badge variant={product.isActive ? "success" : "secondary"}>{product.isActive ? "Aktif" : "Nonaktif"}</Badge>} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardHeader><CardTitle>Stok fisik</CardTitle></CardHeader><CardContent><p className="type-kpi">{number(detail.physical)} <span className="type-body">CTN</span></p></CardContent></Card>
        <Card><CardHeader><CardTitle>Stok tersedia</CardTitle></CardHeader><CardContent><p className="type-kpi">{number(detail.available)} <span className="type-body">CTN</span></p><p className="mt-1 type-caption text-muted-foreground">Hanya batch layak keluar</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Informasi master</CardTitle></CardHeader><CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(([label, value]) => <div key={label}><dt className="type-caption text-muted-foreground">{label}</dt><dd className="mt-1 type-label break-all">{value}</dd></div>)}</dl>
      </CardContent></Card>
      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="type-section-title">Stok per batch</h2>
        <Table aria-label="Stok per batch">
          <TableHeader><TableRow>{["Kode lot / Batch supplier", "Lokasi", "Diterima", "Expiry", "Fisik (CTN)", "Tersedia (CTN)", "Status"].map((label, index) => <TableHead key={label} scope="col" className={index === 4 || index === 5 ? "text-right" : undefined}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {detail.batches.map((batch) => {
              const status = batchStatus(batch, candidate, today)
              return <TableRow key={batch.id}>
                <TableCell><p className="type-label">{batch.internalLotCode}</p><p className="type-caption text-muted-foreground">{batch.supplierBatchNo ?? "—"}</p></TableCell>
                <TableCell>{batch.location.code} · {batch.location.name}</TableCell><TableCell>{date.format(batch.receivedAt)}</TableCell><TableCell>{batch.expiryDate ? dateOnly.format(batch.expiryDate) : "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{number(batch.qtyOnHand)}</TableCell><TableCell className="text-right tabular-nums">{number(status === "Tersedia" ? batch.qtyOnHand : 0)}</TableCell>
                <TableCell><Badge variant={status === "Tersedia" ? "success" : status === "Habis" ? "secondary" : status === "Expired" || status === "Diblokir" ? "danger" : "warning"}>{status}</Badge></TableCell>
              </TableRow>
            })}
            {!detail.batches.length && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Belum ada batch penerimaan.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <ListPagination total={detail.total} page={detail.page} pages={detail.pages} href={(page) => "/data-barang/" + id + "?page=" + page} />
      </section>
      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="type-section-title">Riwayat stok (20 mutasi terakhir)</h2>
        <Table aria-label="Riwayat stok">
          <TableHeader><TableRow>{["Waktu (WIB)", "Transaksi", "Lot", "Sebelum", "Mutasi", "Sesudah"].map((label, index) => <TableHead key={label} scope="col" className={index >= 3 ? "text-right" : undefined}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {detail.movements.map((row) => <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">{time.format(row.createdAt)}</TableCell><TableCell>{row.transactionItem.transaction.number} · {row.transactionItem.transaction.type}</TableCell>
              <TableCell>{row.batch.internalLotCode}</TableCell><TableCell className="text-right tabular-nums">{number(row.qtyBefore)}</TableCell>
              <TableCell className="text-right tabular-nums">{row.signedDelta > 0 ? "+" : ""}{number(row.signedDelta)}</TableCell>
              <TableCell className="text-right tabular-nums">{number(row.qtyAfter)}</TableCell>
            </TableRow>)}
            {!detail.movements.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada mutasi stok.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </section>
    </PageContainer>
  )
}

export default function Page(props: Props) {
  return <Suspense fallback={<PageContainer><p role="status" className="type-body text-muted-foreground">Memuat detail barang...</p></PageContainer>}><ProductDetail {...props} /></Suspense>
}
