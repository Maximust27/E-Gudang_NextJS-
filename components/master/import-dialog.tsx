"use client"

import { useId, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, FileSpreadsheet, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { checkImportFile, fillImportTemplate, readImportWorkbook } from "@/lib/master/import-workbook"
import { importMaxRows, type ImportPreview, type ImportRow } from "@/lib/master/import-schema"
import { commitImportAction, previewImportAction } from "@/lib/master/import-actions"
import type { CategoryOption } from "@/lib/master/types"

export function ImportDialog({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next) }}>
      <DialogTrigger asChild>
        <Button variant="outline"><FileSpreadsheet aria-hidden="true" />Import Excel</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl" showCloseButton={!busy}
        onEscapeKeyDown={(e) => { if (busy) e.preventDefault() }}
        onPointerDownOutside={(e) => { if (busy) e.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>Import master barang</DialogTitle>
          <DialogDescription>Tambah SKU baru dari template Excel. Tidak menimpa data atau mengubah stok.</DialogDescription>
        </DialogHeader>
        {open && <ImportForm categories={categories} busy={busy} onBusy={setBusy} close={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ImportForm({ categories, busy, onBusy, close }: {
  categories: CategoryOption[]
  busy: boolean
  onBusy: (value: boolean) => void
  close: () => void
}) {
  const id = useId()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [message, setMessage] = useState("")
  const [phase, setPhase] = useState<"download" | "preview" | "commit" | null>(null)

  async function run(task: "download" | "preview" | "commit", operation: () => Promise<void>) {
    onBusy(true)
    setPhase(task)
    setMessage("")
    try {
      await operation()
    } catch (error) {
      // Workbook errors are handled at their origin, without exposing raw
      // internal exceptions or database messages to the user.
      setMessage(error instanceof Error && error.name === "ImportFileError" ? error.message : "Proses belum berhasil. Periksa file atau koneksi, lalu coba lagi.")
    } finally {
      onBusy(false)
      setPhase(null)
    }
  }

  const download = () => run("download", async () => {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    fillImportTemplate(workbook, categories)
    const buffer = new Uint8Array(await workbook.xlsx.writeBuffer())
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "E-Gudang-Template-Barang.xlsx"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    // Delay revocation until the browser has consumed the blob URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  })

  const inspect = () => run("preview", async () => {
    setPreview(null)
    setRows([])
    if (!file) return
    let parsed: ImportRow[]
    try {
      checkImportFile(file)
      const ExcelJS = (await import("exceljs")).default
      const workbook = new ExcelJS.Workbook()
      try {
        await workbook.xlsx.load(await file.arrayBuffer())
      } catch {
        throw new Error("File tidak dapat dibaca sebagai workbook .xlsx.")
      }
      parsed = readImportWorkbook(workbook)
    } catch (error) {
      const failure = new Error(error instanceof Error ? error.message : "Format file tidak valid.")
      failure.name = "ImportFileError"
      throw failure
    }
    const result = await previewImportAction(parsed)
    if (!result.ok) { setMessage(result.message); return }
    setRows(parsed)
    setPreview(result.data)
  })

  const commit = () => run("commit", async () => {
    if (!preview?.fingerprint) return
    const result = await commitImportAction(rows, preview.fingerprint)
    if (!result.ok) {
      setMessage(result.message)
      setPreview(null)
      setRows([])
      return
    }
    toast.success(result.data + " barang berhasil diimport.")
    close()
    router.refresh()
  })

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3">
        <div className="min-w-0 flex-1">
          <p className="type-label">1. Unduh template</p>
          <p className="mt-1 type-caption text-muted-foreground">Sheet Barang untuk data, sheet Panduan untuk petunjuk dan kategori aktif.</p>
        </div>
        <Button variant="outline" disabled={busy} onClick={download}><Download aria-hidden="true" />{phase === "download" ? "Menyiapkan..." : "Unduh template"}</Button>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>2. Pilih file Excel</Label>
        <Input id={id} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy}
          onChange={(event) => { setFile(event.target.files?.[0] ?? null); setRows([]); setPreview(null); setMessage("") }}
          aria-describedby={id + "-help"} />
        <p id={id + "-help"} className="type-caption text-muted-foreground">Maksimal 1 MB dan {importMaxRows} baris. SKU dan barcode harus berupa teks; jangan gunakan formula.</p>
        <div><Button variant="outline" disabled={!file || busy} onClick={inspect}><Upload aria-hidden="true" />{phase === "preview" ? "Memeriksa..." : "Periksa & preview"}</Button></div>
      </div>
      {preview && <section className="flex min-w-0 flex-col gap-3" aria-label="Hasil preview">
        <div className="flex flex-wrap items-center gap-2" role="status">
          <h3 className="type-label mr-auto">3. Preview import ({preview.rows.length} baris)</h3>
          <Badge variant="success">{preview.valid} valid</Badge>
          <Badge variant={preview.invalid ? "danger" : "secondary"}>{preview.invalid} bermasalah</Badge>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <Table aria-label="Validasi baris import">
            <TableHeader><TableRow>
              {["Baris", "SKU / Barang", "Barcode", "Kategori / Metode", "Isi / Min. stok", "Status", "Hasil"].map((title) => <TableHead key={title} scope="col">{title}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>{preview.rows.map((row) => <TableRow key={row.row}>
              <TableCell className="tabular-nums">{row.row}</TableCell>
              <TableCell><p className="type-label break-all">{row.sku || "—"}</p><p className="type-caption text-muted-foreground break-words">{row.name}</p></TableCell>
              <TableCell className="break-all">{row.barcode || "—"}</TableCell>
              <TableCell><p className="break-words">{row.category || "—"}</p><p className="type-caption text-muted-foreground">{row.method}</p></TableCell>
              <TableCell className="whitespace-nowrap tabular-nums"><p>{row.piecesPerCarton || "—"} pcs/karton</p><p className="type-caption text-muted-foreground">{row.minStock} CTN</p></TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell className="min-w-40">
                {row.issues.length ? <ul className="flex flex-col gap-1 type-caption text-danger-foreground">{row.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul> : <Badge variant="success">Valid</Badge>}
              </TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </div>
        <p className="type-caption text-muted-foreground">{preview.invalid ? "Perbaiki semua baris bermasalah di Excel, pilih ulang file, lalu periksa kembali. Tidak ada data yang disimpan." : "Seluruh baris akan divalidasi ulang dan disimpan dalam satu transaksi database."}</p>
      </section>}
      {message && <p role="alert" className="rounded-md bg-danger-surface p-3 type-body text-danger-foreground">{message}</p>}
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={close}>Batal</Button>
        <Button disabled={busy || !preview?.fingerprint || !!preview.invalid} onClick={commit}>
          {phase === "commit" ? "Mengimport..." : preview?.fingerprint ? "Import " + preview.valid + " barang" : "Import barang"}
        </Button>
      </DialogFooter>
    </div>
  )
}
