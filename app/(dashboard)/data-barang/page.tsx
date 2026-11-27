import type { Metadata } from "next"
import { Suspense } from "react"
import { PageContainer } from "@/components/shared/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { MasterEditor } from "@/components/master/editor"
import { ImportDialog } from "@/components/master/import-dialog"
import { MasterTable } from "@/components/master/master-table"
import { ListControls, MasterPagination } from "@/components/master/list-controls"
import { requirePermission } from "@/lib/auth/access"
import { can } from "@/lib/permissions"
import { readCategoryOptions, readMasterList } from "@/lib/master/read"
import { parseListQuery, type SearchParams } from "@/lib/master/query"

export const metadata: Metadata = { title: "Data Barang" }

async function Products({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("products:view")
  const query = parseListQuery(await searchParams)
  const [list, categories] = await Promise.all([readMasterList("product", query), readCategoryOptions()])
  const editable = can(user.role, "products:manage")
  return (
    <PageContainer>
      <PageHeader title="Data Barang" description="Kelola informasi SKU dan inventaris gudang."
        actions={<>
          {can(user.role, "products:import") && <ImportDialog categories={categories} />}
          {editable && <MasterEditor kind="product" categories={categories} />}
        </>} />
      <div className="flex min-w-0 flex-col gap-3">
        <ListControls key={JSON.stringify(query)} path="/data-barang" query={query} categories={categories} codes />
        <MasterTable kind="product" rows={list.rows} editable={editable} categories={editable ? categories : undefined} />
        <MasterPagination path="/data-barang" query={query} total={list.total} page={list.page} pages={list.pages} />
      </div>
      <p className="type-caption text-muted-foreground">Stok tersedia tidak mencakup batch expired, diblokir, atau metadata yang tidak sesuai. Transaksi masuk dan keluar akan dikelola pada fase inventaris.</p>
    </PageContainer>
  )
}

export default function Page(props: { searchParams: Promise<SearchParams> }) {
  return <Suspense fallback={<PageContainer><PageHeader title="Data Barang" /><p role="status" className="type-body text-muted-foreground">Memuat data...</p></PageContainer>}><Products {...props} /></Suspense>
}
