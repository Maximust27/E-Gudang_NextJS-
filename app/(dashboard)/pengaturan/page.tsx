import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PageContainer } from "@/components/shared/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MasterEditor } from "@/components/master/editor"
import { MasterTable } from "@/components/master/master-table"
import { ListControls, MasterPagination } from "@/components/master/list-controls"
import { requirePermission } from "@/lib/auth/access"
import { readAudit, readGeneral, readMasterList } from "@/lib/master/read"
import { parseListQuery, settingsTabs, type ListQuery, type SearchParams } from "@/lib/master/query"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Pengaturan" }

async function SettingsContent({ query }: { query: ListQuery }) {
  const tab = query.tab
  if (tab === "general") {
    const values = await readGeneral()
    return <Card><CardHeader><CardTitle>Ambang operasional</CardTitle></CardHeader><CardContent className="flex flex-col gap-4">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div><dt className="type-label">Mendekati expiry</dt><dd className="mt-1 type-kpi">{values.nearExpiryDays} <span className="type-body">hari</span></dd></div>
        <div><dt className="type-label">Dead stock</dt><dd className="mt-1 type-kpi">{values.deadStockDays} <span className="type-body">hari</span></dd></div>
      </dl>
      <p className="type-body text-muted-foreground">Nilai digunakan untuk peringatan expiry dan analisis dead stock. Minimum stok diatur per SKU.</p>
      <div><MasterEditor kind="general" general={values} /></div>
    </CardContent></Card>
  }

  if (tab === "audit") {
    await requirePermission("audit:view")
    const logs = await readAudit(query)
    const time = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })
    return <div className="flex min-w-0 flex-col gap-3">
      <ListControls key={JSON.stringify(query)} path="/pengaturan" query={query} tab="audit" audit />
      <Table aria-label="Audit log">
        <TableHeader><TableRow>{["Waktu (WIB)", "Pengguna", "Aksi", "Entitas", "Detail"].map((label) => <TableHead key={label} scope="col">{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {logs.rows.map((row) => <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap">{time.format(row.createdAt)}</TableCell>
            <TableCell>{row.user.name}</TableCell><TableCell>{row.action === "CREATE" ? "Tambah" : row.action === "UPDATE" ? "Ubah" : row.action}</TableCell>
            <TableCell>{row.entityType} #{row.entityId}</TableCell>
            <TableCell><details><summary className="cursor-pointer type-label">Lihat perubahan</summary>
              <dl className="mt-2 grid min-w-40 gap-1 type-caption text-muted-foreground">
                {Object.entries(row.metadata).map(([key, value]) => <div key={key} className="flex flex-wrap gap-1"><dt>{key}:</dt><dd className="break-all">{value === null ? "—" : typeof value === "boolean" ? value ? "Ya" : "Tidak" : String(value)}</dd></div>)}
              </dl>
            </details></TableCell>
          </TableRow>)}
          {!logs.rows.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada aktivitas yang ditemukan.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <MasterPagination path="/pengaturan" query={query} tab="audit" total={logs.total} page={logs.page} pages={logs.pages} />
    </div>
  }

  if (tab === "user") await requirePermission("users:manage")
  const list = await readMasterList(tab, query)
  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label={settingsTabs.find((item) => item.key === tab)?.label}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-section-title">{settingsTabs.find((item) => item.key === tab)?.label}</h2>
        <MasterEditor kind={tab} />
      </div>
      <ListControls key={JSON.stringify(query)} path="/pengaturan" query={query} tab={tab} codes={tab === "supplier" || tab === "location"} />
      <MasterTable kind={tab} rows={list.rows} editable />
      <MasterPagination path="/pengaturan" query={query} tab={tab} total={list.total} page={list.page} pages={list.pages} />
    </section>
  )
}

async function Settings({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePermission("settings:manage")
  const query = parseListQuery(await searchParams)
  return (
    <PageContainer>
      <PageHeader title="Pengaturan" description="Kelola konfigurasi dan data master gudang." />
      <nav aria-label="Bagian pengaturan" className="flex gap-1 overflow-x-auto border-b border-border">
        {settingsTabs.map((item) => <Link key={item.key} href={"/pengaturan?tab=" + item.key} aria-current={query.tab === item.key ? "page" : undefined}
          className={cn("shrink-0 border-b-2 border-transparent px-3 py-3 type-label text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]", query.tab === item.key && "border-primary text-foreground")}>{item.label}</Link>)}
      </nav>
      <SettingsContent query={query} />
    </PageContainer>
  )
}

export default function Page(props: { searchParams: Promise<SearchParams> }) {
  return <Suspense fallback={<PageContainer><PageHeader title="Pengaturan" /><p role="status" className="type-body text-muted-foreground">Memuat data...</p></PageContainer>}><Settings {...props} /></Suspense>
}
