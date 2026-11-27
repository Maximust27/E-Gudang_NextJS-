import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { listHref, pageSize, type ListQuery, type SettingsTab } from "@/lib/master/query"
import type { CategoryOption } from "@/lib/master/types"

const selectClass = "min-h-control pointer-coarse:min-h-control-touch rounded-md border border-input bg-card px-3 py-2 type-body max-md:text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
function FilterSelect({ name, label, value, children }: { name: string; label: string; value: string; children: ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1">
    <span className="type-caption text-muted-foreground">{label}</span>
    <select name={name} defaultValue={value} className={selectClass}>{children}</select>
  </label>
}

export function ListControls({ path, query, tab, categories, codes, audit = false }: {
  path: string; query: ListQuery; tab?: SettingsTab; categories?: CategoryOption[]; codes?: boolean; audit?: boolean
}) {
  const resetHref = path + (tab ? "?tab=" + tab : "")
  return (
    <form action={path} method="get" className="flex flex-wrap items-end gap-3">
      {tab && <input type="hidden" name="tab" value={tab} />}
      <label className="flex min-w-44 flex-1 flex-col gap-1">
        <span className="type-caption text-muted-foreground">Pencarian</span>
        <Input name="q" defaultValue={query.q} placeholder={categories ? "Nama, SKU, atau barcode..." : audit ? "Aktor, aksi, atau entitas..." : "Cari data..."} maxLength={100} type="search" />
      </label>
      {categories && <>
        <FilterSelect name="category" label="Kategori" value={String(query.categoryId ?? "")}>
          <option value="">Semua kategori</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </FilterSelect>
        <FilterSelect name="method" label="Metode" value={query.method}>
          <option value="all">Semua metode</option><option value="FIFO">FIFO</option><option value="FEFO">FEFO</option>
        </FilterSelect>
      </>}
      {!audit && <>
        <FilterSelect name="status" label="Status" value={query.status}>
          <option value="all">Semua status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option>
        </FilterSelect>
        <FilterSelect name="sort" label="Urutkan" value={query.sort}>
          <option value="name-asc">Nama A–Z</option><option value="name-desc">Nama Z–A</option>
          {codes && <option value="code-asc">{categories ? "SKU A–Z" : "Kode A–Z"}</option>}
          <option value="newest">Terakhir diubah</option>
        </FilterSelect>
      </>}
      <Button type="submit"><Search aria-hidden="true" />Terapkan</Button>
      <Button asChild variant="outline"><Link href={resetHref}>Reset</Link></Button>
    </form>
  )
}

export function ListPagination({ total, page, pages, href }: { total: number; page: number; pages: number; href: (page: number) => string }) {
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="type-caption text-muted-foreground tabular-nums">
        {total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} dari {total.toLocaleString("id-ID")} data
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? <Button asChild variant="outline" size="icon-sm"><Link href={href(page - 1)} aria-label="Halaman sebelumnya"><ChevronLeft aria-hidden="true" /></Link></Button>
          : <Button variant="outline" size="icon-sm" disabled aria-label="Halaman sebelumnya"><ChevronLeft aria-hidden="true" /></Button>}
        <span className="type-caption tabular-nums">Halaman {page} / {pages}</span>
        {page < pages ? <Button asChild variant="outline" size="icon-sm"><Link href={href(page + 1)} aria-label="Halaman berikutnya"><ChevronRight aria-hidden="true" /></Link></Button>
          : <Button variant="outline" size="icon-sm" disabled aria-label="Halaman berikutnya"><ChevronRight aria-hidden="true" /></Button>}
      </div>
    </nav>
  )
}

export function MasterPagination({ path, query, tab, ...rest }: { path: string; query: ListQuery; tab?: SettingsTab; total: number; page: number; pages: number }) {
  return <ListPagination {...rest} href={(page) => listHref(path, query, page, tab)} />
}
