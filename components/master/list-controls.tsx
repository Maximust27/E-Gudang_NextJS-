import Link from "next/link"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectItem } from "@/components/ui/select"
import { FilterSelect } from "./filter-select"
import { listHref, pageSize, type ListQuery, type SettingsTab } from "@/lib/master/query"
import type { CategoryOption } from "@/lib/master/types"

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
        <FilterSelect name="category" label="Kategori" value={String(query.categoryId ?? "all")}>
          <SelectItem value="all">Semua kategori</SelectItem>
          {categories.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
        </FilterSelect>
        <FilterSelect name="method" label="Metode" value={query.method}>
          <SelectItem value="all">Semua metode</SelectItem><SelectItem value="FIFO">FIFO</SelectItem><SelectItem value="FEFO">FEFO</SelectItem>
        </FilterSelect>
      </>}
      {!audit && <>
        <FilterSelect name="status" label="Status" value={query.status}>
          <SelectItem value="all">Semua status</SelectItem><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Nonaktif</SelectItem>
        </FilterSelect>
        <FilterSelect name="sort" label="Urutkan" value={query.sort}>
          <SelectItem value="name-asc">Nama A–Z</SelectItem><SelectItem value="name-desc">Nama Z–A</SelectItem>
          {codes && <SelectItem value="code-asc">{categories ? "SKU A–Z" : "Kode A–Z"}</SelectItem>}
          <SelectItem value="newest">Terakhir diubah</SelectItem>
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
