"use client"

import { useId, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveMasterAction } from "@/lib/master/actions"
import { masterSchema, type MasterKind } from "@/lib/master/schema"
import type { CategoryOption, GeneralValues, MasterRow } from "@/lib/master/types"

type Option = { value: string; label: string; disabled?: boolean }
type Field = { name: string; label: string; initial: string; type?: "text" | "email" | "number" | "password"; options?: Option[]; required?: boolean; hint?: string; maxLength?: number }
const options = (...values: string[]): Option[] => values.map((value) => ({ value, label: value }))
const status: Field = { name: "isActive", label: "Status", initial: "active", options: [{ value: "active", label: "Aktif" }, { value: "inactive", label: "Nonaktif" }] }
const nameField: Field = { name: "name", label: "Nama", initial: "", required: true, maxLength: 180 }
export const masterLabels: Record<MasterKind, string> = { category: "Kategori", supplier: "Supplier", location: "Lokasi Rak", user: "Pengguna", product: "Barang", general: "Pengaturan Umum" }

function fieldsFor(kind: MasterKind, categories: CategoryOption[], record?: MasterRow): Field[] {
  switch (kind) {
    case "category": return [{ ...nameField, maxLength: 120 }, { name: "defaultMethod", label: "Metode default", initial: "FIFO", options: options("FIFO", "FEFO") }, status]
    case "supplier": return [nameField, { name: "code", label: "Kode supplier (opsional)", initial: "", maxLength: 64 }, status]
    case "location": return [{ ...nameField, maxLength: 120 }, { name: "code", label: "Kode rak", initial: "", required: true, maxLength: 64 }, status]
    case "user": return [
      { ...nameField, maxLength: 120 }, { name: "email", label: "Email", type: "email", initial: "", required: true, maxLength: 254 },
      { name: "role", label: "Role", initial: "OPERATOR", options: [{ value: "ADMIN", label: "Admin" }, { value: "OPERATOR", label: "Operator" }] }, status,
      { name: "password", label: record ? "Password baru (opsional)" : "Password", type: "password", initial: "", required: !record, hint: "Minimal 15 karakter, maksimal 72 byte. Mengganti password mencabut session lama." },
      { name: "passwordConfirm", label: "Ulangi password", type: "password", initial: "", required: !record },
    ]
    case "product": return [
      { ...nameField, label: "Nama barang" },
      { name: "sku", label: "SKU", initial: "", required: true, maxLength: 64 },
      { name: "cartonBarcode", label: "Barcode karton", initial: "", required: true, maxLength: 128, hint: "Scan atau ketik kode. Nol di depan tetap disimpan." },
      { name: "categoryId", label: "Kategori", initial: "", required: true, options: categories.filter((c) => c.isActive || String(c.id) === record?.values.categoryId).map((c) => ({ value: String(c.id), label: c.name + " (" + c.defaultMethod + ")" + (c.isActive ? "" : " — nonaktif") })) },
      { name: "methodOverride", label: "Metode pengeluaran", initial: "DEFAULT", options: [{ value: "DEFAULT", label: "Ikuti kategori" }, ...options("FIFO", "FEFO")] },
      { name: "piecesPerCarton", label: "Isi per karton (opsional)", type: "number", initial: "" },
      { name: "minStock", label: "Minimum stok (CTN)", type: "number", initial: "0", required: true }, status,
    ]
    case "general": return [
      { name: "nearExpiryDays", label: "Mendekati expiry (hari)", type: "number", initial: "30", required: true },
      { name: "deadStockDays", label: "Dead stock (hari)", type: "number", initial: "60", required: true },
    ]
  }
}

type Props = { kind: MasterKind; record?: MasterRow; categories?: CategoryOption[]; general?: GeneralValues }
export function MasterEditor(props: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const editing = !!props.record || props.kind === "general"
  const title = (editing ? "Edit " : "Tambah ") + masterLabels[props.kind]

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next) }}>
      <DialogTrigger asChild>
        <Button variant={editing ? "outline" : "default"} size={props.record ? "sm" : "default"} aria-label={props.record ? "Edit " + props.record.name : title}>
          {editing ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {props.record ? "Edit" : title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={!busy} onEscapeKeyDown={(e) => { if (busy) e.preventDefault() }} onPointerDownOutside={(e) => { if (busy) e.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{props.kind === "product" ? "Perubahan master tidak menambah atau mengurangi stok." : "Perubahan disimpan dengan audit log."}</DialogDescription>
        </DialogHeader>
        {open && <EditorForm {...props} close={() => setOpen(false)} onBusy={setBusy} />}
      </DialogContent>
    </Dialog>
  )
}

function EditorForm({ kind, record, categories = [], general, close, onBusy }: Props & { close: () => void; onBusy: (busy: boolean) => void }) {
  const router = useRouter()
  const prefix = useId()
  const fields = fieldsFor(kind, categories, record)
  const initial = Object.fromEntries(fields.map((field) => [field.name, record?.values[field.name] ?? (general && field.name === "nearExpiryDays" ? general.nearExpiryDays : general && field.name === "deadStockDays" ? general.deadStockDays : field.initial)]))
  const { register, control, handleSubmit, formState: { isSubmitting, errors }, setError, clearErrors } = useForm<Record<string, string>>({ defaultValues: initial })
  const [message, setMessage] = useState("")

  const submit = handleSubmit(async (values) => {
    setMessage("")
    clearErrors()
    if (kind === "user" && values.password !== values.passwordConfirm) {
      setError("passwordConfirm", { message: "Konfirmasi password tidak cocok." })
      setMessage("Periksa kembali isian form.")
      return
    }
    const payload = kind === "general"
      ? { ...values, kind, nearVersion: general?.nearVersion ?? null, deadVersion: general?.deadVersion ?? null }
      : { ...values, kind, id: record?.id ?? null, updatedAt: record?.updatedAt ?? null }
    const parsed = masterSchema.safeParse(payload)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === "string" && fields.some((item) => item.name === field)) setError(field, { message: issue.message })
      }
      setMessage("Periksa kembali isian form.")
      return
    }
    onBusy(true)
    try {
      const result = await saveMasterAction(payload)
      if (!result.ok) { setMessage(result.message); return }
      toast.success(result.message)
      close()
      router.refresh()
    } catch {
      setMessage("Data belum dapat disimpan. Muat ulang halaman lalu coba lagi.")
    } finally {
      onBusy(false)
    }
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className={kind === "product" || kind === "user" ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
        {fields.map((field) => {
          const id = prefix + "-" + field.name
          const error = errors[field.name]?.message
          return (
            <div className="flex min-w-0 flex-col gap-2" key={field.name}>
              <Label htmlFor={id}>{field.label}</Label>
              {field.options ? (
                <Controller name={field.name} control={control} render={({ field: value }) => (
                  <Select value={value.value} onValueChange={value.onChange} disabled={isSubmitting}>
                    <SelectTrigger ref={value.ref} id={id} onBlur={value.onBlur} className="w-full" aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined}>
                      <SelectValue placeholder="Pilih..." />
                    </SelectTrigger>
                    <SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              ) : (
                <Input {...register(field.name)} id={id} type={field.type ?? "text"} disabled={isSubmitting} required={field.required}
                  min={field.type === "number" ? (field.name === "minStock" ? 0 : 1) : undefined} step={field.type === "number" ? 1 : undefined}
                  maxLength={field.maxLength} autoComplete={field.type === "password" ? "new-password" : field.type === "email" ? "off" : undefined}
                  onKeyDown={field.name === "cartonBarcode" ? (event) => { if (event.key === "Enter") event.preventDefault() } : undefined}
                  aria-invalid={!!error} aria-describedby={error ? id + "-error" : field.hint ? id + "-hint" : undefined} />
              )}
              {field.hint && <p id={id + "-hint"} className="type-caption text-muted-foreground">{field.hint}</p>}
              {error && <p role="alert" id={id + "-error"} className="type-caption text-danger-foreground">{error}</p>}
            </div>
          )
        })}
      </div>
      {kind !== "general" && record && <p className="type-caption text-muted-foreground">Nonaktif mempertahankan histori. Pastikan status dan perubahan lainnya sudah benar sebelum menyimpan.</p>}
      {message && <p role="alert" className="rounded-md bg-danger-surface p-3 type-body text-danger-foreground">{message}</p>}
      <DialogFooter>
        <Button variant="outline" disabled={isSubmitting} onClick={close}>Batal</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button>
      </DialogFooter>
    </form>
  )
}
