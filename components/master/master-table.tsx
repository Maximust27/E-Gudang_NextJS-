"use client"

import Link from "next/link"
import { useMemo } from "react"
import { tableFeatures, useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CategoryOption, MasterRow } from "@/lib/master/types"
import { MasterEditor } from "./editor"

const features = tableFeatures({})
type Kind = "category" | "supplier" | "location" | "user" | "product"
const headers: Record<Kind, string[]> = {
  category: ["Metode default", "Jumlah SKU"],
  supplier: ["Kode supplier"],
  location: ["Kode rak"],
  user: ["Role"],
  product: ["Kategori", "Tersedia (CTN)", "Metode"],
}

export function MasterTable({ kind, rows, editable, categories = [] }: {
  kind: Kind; rows: MasterRow[]; editable: boolean; categories?: CategoryOption[]
}) {
  const columns = useMemo(() => {
    const result: ColumnDef<typeof features, MasterRow>[] = [
      {
        accessorKey: "name",
        header: kind === "product" ? "Barang / SKU" : "Nama",
        cell: ({ row }) => (
          <div className="flex min-w-36 flex-col gap-1">
            <span className="type-label break-words">{row.original.name}</span>
            {row.original.secondary && <span className="type-caption text-muted-foreground break-all">{row.original.secondary}</span>}
          </div>
        ),
      },
      ...headers[kind].map((header, index): ColumnDef<typeof features, MasterRow> => ({
        id: "value-" + index,
        accessorFn: (row) => row.cells[index],
        header,
        cell: ({ row }) => kind === "product" && index === 2 || kind === "category" && index === 0
          ? <Badge variant="outline">{row.original.cells[index]}</Badge>
          : <span className={header.includes("CTN") || header === "Jumlah SKU" ? "tabular-nums" : "break-words"}>{row.original.cells[index]}</span>,
      })),
      {
        accessorKey: "isActive", header: "Status",
        cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "secondary"}>{row.original.isActive ? "Aktif" : "Nonaktif"}</Badge>,
      },
    ]
    if (editable || kind === "product") result.push({
      id: "actions", header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          {kind === "product" && <Button asChild variant="ghost" size="sm"><Link href={"/data-barang/" + row.original.id} aria-label={"Detail " + row.original.name}>Detail</Link></Button>}
          {editable && <MasterEditor kind={kind} record={row.original} categories={categories} />}
        </div>
      ),
    })
    return result
  }, [kind, editable, categories])

  // The database already applies search/filter/order/page; no client-side
  // filtering or pagination over a partial dataset.
  const table = useTable({ features, columns, data: rows, getRowId: (row) => String(row.id) })
  const numeric = (id: string) => kind === "product" && id === "value-1" || kind === "category" && id === "value-1"

  return (
    <Table aria-label={kind === "product" ? "Daftar barang" : "Daftar master data"}>
      <TableHeader>
        {table.getHeaderGroups().map((group) => <TableRow key={group.id}>
          {group.headers.map((header) => <TableHead key={header.id} scope="col" className={numeric(header.column.id) ? "text-right" : undefined}>
            {!header.isPlaceholder && <table.FlexRender header={header} />}
          </TableHead>)}
        </TableRow>)}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => <TableRow key={row.id}>
          {row.getAllCells().map((cell) => <TableCell key={cell.id} className={numeric(cell.column.id) ? "text-right" : undefined}>
            <table.FlexRender cell={cell} />
          </TableCell>)}
        </TableRow>)}
        {!rows.length && <TableRow><TableCell colSpan={columns.length} className="py-10 text-center">
          <p className="type-label">Belum ada data yang ditemukan</p>
          <p className="mt-1 type-body text-muted-foreground">Tambahkan data atau sesuaikan pencarian dan filter.</p>
        </TableCell></TableRow>}
      </TableBody>
    </Table>
  )
}
