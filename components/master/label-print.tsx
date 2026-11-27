"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { barcodeFits, barcodeRuns, barcodeWidthMm, labelMaxCopies, labelModuleMm, labelQuietModules, parseCopies, type LabelWidth } from "@/lib/barcode/encode"

export type LabelData = {
  kind: "SKU" | "BATCH"
  productName: string
  sku: string
  code: string
  productId: number
  location?: string
  expiry?: string
}

function PrintedLabel({ data, bits, width }: { data: LabelData; bits: string; width: LabelWidth }) {
  const modules = bits.length + labelQuietModules * 2
  const physicalWidth = barcodeWidthMm(bits)
  return (
    <article className="eg-print-label" style={{ width: width + "mm" }}>
      <div className="eg-print-label-heading"><span>E-Gudang</span><span>{data.kind === "SKU" ? "KARTON / SKU" : "BATCH / LOT"}</span></div>
      <p className="eg-print-product">{data.productName}</p>
      <p className="eg-print-meta">SKU: {data.sku}</p>
      {data.kind === "BATCH" && <p className="eg-print-meta">{data.location ? "Rak: " + data.location : "Rak: —"} · Exp: {data.expiry ?? "—"}</p>}
      <div className="eg-print-barcode">
        <svg role="img" aria-label={"Barcode " + data.code} viewBox={"0 0 " + modules + " " + (18 / labelModuleMm)} width={physicalWidth + "mm"} height="18mm" shapeRendering="crispEdges">
          <rect x="0" y="0" width={modules} height={18 / labelModuleMm} fill="white" />
          {barcodeRuns(bits).map((run) => <rect key={run.x} x={run.x} width={run.width} height={18 / labelModuleMm} fill="black" />)}
        </svg>
        <p className="eg-print-code">{data.code}</p>
      </div>
    </article>
  )
}

export function LabelPrint({ data, bits, error }: { data: LabelData; bits: string | null; error: string | null }) {
  const id = useId()
  const [copiesText, setCopiesText] = useState("1")
  const [width, setWidth] = useState<LabelWidth>(bits && barcodeFits(bits, 90) ? 90 : 180)
  const copies = parseCopies(copiesText)
  const fits = !!bits && barcodeFits(bits, width)
  const ready = !!bits && fits && copies !== null
  const perSheet = width === 90 ? 10 : 5

  return (
    <main data-label-print="" className="eg-print-page">
      <div className="eg-print-controls print:hidden">
        <Button asChild variant="ghost" size="sm"><Link href={"/data-barang/" + data.productId}><ArrowLeft aria-hidden="true" />Kembali ke detail barang</Link></Button>
        <Card>
          <CardHeader><CardTitle>Cetak label {data.kind === "SKU" ? "SKU" : "batch"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="type-body text-muted-foreground">Code 128 · Kertas A4 · Pilih ukuran label dan jumlah salinan. Kode mengikuti data tersimpan; pencetakan tidak mengubah stok.</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={id + "-size"}>Ukuran label</Label>
                <Select value={String(width)} onValueChange={(value) => setWidth(value === "180" ? 180 : 90)}>
                  <SelectTrigger id={id + "-size"} className="bg-card px-3"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" align="start" sideOffset={4}>
                    <SelectItem value="90">90 × 50 mm (2 kolom)</SelectItem>
                    <SelectItem value="180">180 × 50 mm (1 kolom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-28 flex-col gap-2">
                <Label htmlFor={id + "-copies"}>Jumlah label</Label>
                <Input id={id + "-copies"} type="number" min={1} max={labelMaxCopies} step={1} value={copiesText} onChange={(event) => setCopiesText(event.target.value)} aria-invalid={copies === null} />
              </div>
              <Button disabled={!ready} onClick={() => window.print()}><Printer aria-hidden="true" />Cetak label</Button>
            </div>
            {error && <p role="alert" className="type-body text-danger-foreground">{error}</p>}
            {bits && !fits && <p role="alert" className="type-body text-danger-foreground">Kode terlalu panjang untuk ukuran label ini. Pilih label lebar, atau gunakan barcode yang lebih singkat melalui pengelolaan master.</p>}
            {copies === null && <p role="alert" className="type-body text-danger-foreground">Jumlah label harus 1–{labelMaxCopies}.</p>}
            <p className="type-caption text-muted-foreground">Atur A4, skala 100% (actual size), nonaktifkan header/footer browser. Lakukan uji scan hasil cetak sebelum digunakan pada karton.</p>
          </CardContent>
        </Card>
        <h2 className="type-section-title">Pratinjau label</h2>
      </div>
      {ready && <div className="eg-print-preview">
        {Array.from({ length: Math.ceil(copies / perSheet) }, (_, sheet) => (
          <div key={sheet} className="eg-print-sheet" style={{ gridTemplateColumns: "repeat(" + (width === 90 ? 2 : 1) + ", " + width + "mm)" }}>
            {Array.from({ length: Math.min(perSheet, copies - sheet * perSheet) }, (_, index) => <PrintedLabel key={index} data={data} bits={bits} width={width} />)}
          </div>
        ))}
      </div>}
    </main>
  )
}
