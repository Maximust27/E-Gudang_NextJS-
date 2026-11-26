"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Plus, Search, Sun, Moon, Monitor, MoreHorizontal, Package, Download, LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, Settings, Warehouse } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { PageContainer } from "@/components/shared/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { SectionHeader } from "@/components/shared/section-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

const palette = [
  ["Primary", "bg-primary"],
  ["Background", "bg-background"],
  ["Card", "bg-card"],
  ["Muted", "bg-muted"],
  ["Border", "bg-border"],
  ["Success", "bg-success"],
  ["Warning", "bg-warning"],
  ["Danger", "bg-destructive"],
] as const

const sampleRows = [
  { sku: "SKU-001", name: "Mie instan", stock: 120, method: "FEFO", status: "Tersedia", variant: "success" },
  { sku: "SKU-002", name: "Sabun mandi", stock: 8, method: "FIFO", status: "Menipis", variant: "warning" },
  { sku: "SKU-003", name: "Tisu wajah", stock: 0, method: "FIFO", status: "Habis", variant: "danger" },
] as const

const chartData = [
  { day: "Sen", inbound: 120, outbound: 80 },
  { day: "Sel", inbound: 90, outbound: 110 },
  { day: "Rab", inbound: 150, outbound: 100 },
  { day: "Kam", inbound: 110, outbound: 70 },
  { day: "Jum", inbound: 180, outbound: 130 },
]

const chartConfig = {
  inbound: { label: "Barang masuk (CTN)", color: "var(--chart-1)" },
  outbound: { label: "Barang keluar (CTN)", color: "var(--chart-2)" },
} satisfies ChartConfig

const numberFormat = new Intl.NumberFormat("id-ID")

const previewKpis = [
  { label: "Total stok", value: 12480, detail: "Karton tersedia" },
  { label: "Total SKU", value: 248, detail: "Varian barang aktif" },
  { label: "Stok menipis", value: 8, detail: "SKU perlu diperiksa" },
  { label: "Transaksi hari ini", value: 32, detail: "Barang masuk & keluar" },
]

const navigationPreview = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Data Barang", icon: Package, active: false },
  { label: "Barang Masuk", icon: ArrowDownToLine, active: false },
  { label: "Barang Keluar", icon: ArrowUpFromLine, active: false },
  { label: "Stok Opname", icon: ClipboardCheck, active: false },
  { label: "Pengaturan", icon: Settings, active: false },
]

export default function Home() {
  const { setTheme } = useTheme()
  const [query, setQuery] = useState("")
  const [date, setDate] = useState<Date>()
  const [page, setPage] = useState(1)
  const rows = sampleRows.filter((row) =>
    (row.name + " " + row.sku).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <main className="min-w-0">
      <PageContainer className="mx-auto w-full max-w-6xl">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>E-Gudang</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Design System</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeader
          title="E-Gudang Design System"
          description="Monochrome revision · Phase 1.1. Data hanya contoh untuk audit visual."
          actions={
            <>
              <Button variant="outline" onClick={() => setTheme("light")}><Sun /> Terang</Button>
              <Button variant="outline" onClick={() => setTheme("dark")}><Moon /> Gelap</Button>
              <Button variant="outline" onClick={() => setTheme("system")}><Monitor /> Sistem</Button>
            </>
          }
        />

        <section className="flex flex-col gap-3" aria-label="Preview dashboard">
          <SectionHeader title="Ringkasan gudang" description="Contoh susunan visual dashboard; bukan data operasional." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {previewKpis.map((item) => (
              <Card size="sm" key={item.label}>
                <CardContent className="flex min-w-0 flex-col gap-2">
                  <p className="type-label text-muted-foreground">{item.label}</p>
                  <p className="type-kpi">{numberFormat.format(item.value)}</p>
                  <p className="type-caption text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid min-w-0 gap-3 lg:grid-cols-3">
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader>
                <CardTitle>Pergerakan stok</CardTitle>
                <CardDescription>Barang masuk dan keluar · CTN</CardDescription>
              </CardHeader>
              <CardContent className="flex min-w-0 flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="type-caption text-muted-foreground">Barang masuk</p><p className="type-kpi">650</p></div>
                  <div><p className="type-caption text-muted-foreground">Barang keluar</p><p className="type-kpi">490</p></div>
                </div>
                <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full min-w-0">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis width={36} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="inbound" fill="var(--color-inbound)" radius={4} isAnimationActive={false} />
                    <Bar dataKey="outbound" fill="var(--color-outbound)" radius={4} isAnimationActive={false} />
                  </BarChart>
                </ChartContainer>
                <p className="type-caption text-muted-foreground">Contoh data selama lima hari.</p>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Perlu perhatian</CardTitle>
                <CardDescription>Contoh status inventaris</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {[
                  { label: "Stok menipis", count: 8, variant: "warning" },
                  { label: "Stok habis", count: 3, variant: "danger" },
                  { label: "Mendekati expired", count: 5, variant: "warning" },
                  { label: "Expired", count: 1, variant: "danger" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <span className="type-body">{item.label}</span>
                    <Badge variant={item.variant as "warning" | "danger"} className="tabular-nums">{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Surface navigasi" description="Sampel warna sidebar dan active state; app shell sebenarnya berada di branch layout." />
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-lg border border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
              <div className="flex items-center gap-2 border-b border-sidebar-border pb-3">
                <Warehouse className="size-icon-standard" aria-hidden="true" />
                <span className="type-card-title">E-Gudang</span>
              </div>
              {navigationPreview.map(({ label, icon: Icon, active }) => (
                <div key={label} className={active ? "flex min-h-control items-center gap-2 rounded-md bg-sidebar-primary px-3 text-sidebar-primary-foreground type-label" : "flex min-h-control items-center gap-2 rounded-md px-3 type-label"}>
                  <Icon className="size-icon-standard shrink-0" aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle>Visual principles</CardTitle><CardDescription>Monochrome, calm, data-first.</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="type-body">Surface netral, border halus, dan aksen warna hanya untuk data dan status penting.</p>
                <Separator />
                <div className="flex flex-wrap gap-2"><Badge variant="success">Tersedia</Badge><Badge variant="warning">Menipis</Badge><Badge variant="danger">Habis</Badge></div>
                <div className="flex flex-wrap gap-2"><Button onClick={() => toast.success("Contoh aksi utama")}><Plus /> Tambah barang</Button><Button variant="outline" onClick={() => toast.info("Contoh aksi sekunder")}><Download /> Ekspor</Button></div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Warna & typography" description="Token semantik dan hirarki teks global." />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {palette.map(([name, color]) => (
              <Card key={name} size="sm">
                <CardContent className="flex flex-col gap-2">
                  <div className={color + " h-12 rounded-md border border-border"} />
                  <span className="type-label">{name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <p className="type-page-title">Page title · 24/32</p>
              <p className="type-section-title">Section title · 18/28</p>
              <p className="type-card-title">Card title · 16/24</p>
              <p className="type-body">Body · 14/20 — Kelola inventaris gudang.</p>
              <p className="type-label">Label · 14/20</p>
              <p className="type-caption text-muted-foreground">Caption · 12/16</p>
              <p className="type-kpi">12.480</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Tersedia</Badge>
                <Badge variant="warning">Menipis</Badge>
                <Badge variant="danger">Habis</Badge>
                <Badge variant="secondary">FIFO</Badge>
                <Badge variant="secondary">FEFO</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Kontrol dan formulir" />
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Tombol dan feedback</CardTitle><CardDescription>Uji varian, fokus, tooltip, dan toast.</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => toast.success("Contoh berhasil")}><Plus /> Tambah</Button>
                  <Button variant="secondary" onClick={() => toast.info("Informasi contoh")}>Sekunder</Button>
                  <Button variant="outline" onClick={() => toast.warning("Contoh peringatan")}>Outline</Button>
                  <Button variant="destructive" onClick={() => toast.error("Contoh error")}>Destructive</Button>
                  <Button variant="ghost" disabled>Nonaktif</Button>
                  <Tooltip>
                    <TooltipTrigger asChild><Button size="icon" variant="outline" aria-label="Uji ekspor" onClick={() => toast.info("Preview ekspor")}><Download /></Button></TooltipTrigger>
                    <TooltipContent>Ekspor contoh</TooltipContent>
                  </Tooltip>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Avatar><AvatarFallback>EG</AvatarFallback></Avatar>
                  <div><p className="type-label">Operator contoh</p><p className="type-caption text-muted-foreground">Avatar dan metadata</p></div>
                </div>
                <Progress value={65} aria-label="Contoh progres 65 persen" />
                <div className="flex flex-col gap-2" aria-label="Contoh loading">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Form barang</CardTitle><CardDescription>Input, select, textarea, label, dan error state.</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2"><Label htmlFor="demo-name">Nama barang</Label><Input id="demo-name" placeholder="Nama barang" /></div>
                  <div className="flex flex-col gap-2"><Label htmlFor="demo-category">Kategori</Label><Select><SelectTrigger id="demo-category" className="w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger><SelectContent><SelectItem value="food">Makanan</SelectItem><SelectItem value="non-food">Non-makanan</SelectItem></SelectContent></Select></div>
                </div>
                <div className="flex flex-col gap-2"><Label htmlFor="demo-sku">SKU</Label><Input id="demo-sku" aria-invalid="true" aria-describedby="demo-sku-error" placeholder="SKU-001" /><p id="demo-sku-error" className="type-caption text-destructive">Contoh: SKU sudah terdaftar.</p></div>
                <div className="flex flex-col gap-2"><Label htmlFor="demo-note">Catatan</Label><Textarea id="demo-note" placeholder="Catatan opsional" /></div>
                <div className="flex items-center gap-2"><Checkbox id="demo-active" defaultChecked /><Label htmlFor="demo-active">Barang aktif</Label></div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Tabel inventaris" description="Cari contoh SKU atau nama, tanpa database." />
          <div className="max-w-sm flex flex-col gap-2">
            <Label htmlFor="demo-search">Cari barang</Label>
            <InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id="demo-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari SKU atau barang" /></InputGroup>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Barang</TableHead><TableHead className="text-right">Stok (CTN)</TableHead><TableHead>Metode</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((row) => <TableRow key={row.sku}><TableCell>{row.sku}</TableCell><TableCell className="min-w-32">{row.name}</TableCell><TableCell className="text-right tabular-nums">{numberFormat.format(row.stock)}</TableCell><TableCell><Badge variant="secondary">{row.method}</Badge></TableCell><TableCell><Badge variant={row.variant}>{row.status}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={"Aksi " + row.name}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => toast.info(row.name)}>Lihat contoh detail</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Barang tidak ditemukan.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <Pagination><PaginationContent>
            <PaginationItem><PaginationPrevious href="#pagination-preview" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }} /></PaginationItem>
            {[1, 2, 3].map((n) => <PaginationItem key={n}><PaginationLink href="#pagination-preview" isActive={page === n} onClick={(e) => { e.preventDefault(); setPage(n) }}>{n}</PaginationLink></PaginationItem>)}
            <PaginationItem><PaginationNext href="#pagination-preview" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(3, p + 1)) }} /></PaginationItem>
          </PaginationContent></Pagination>
          <p id="pagination-preview" className="type-caption text-center text-muted-foreground">Contoh pagination: halaman {page} dari 3. Data tetap sama.</p>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Overlay dan navigasi" />
          <Card><CardContent className="flex flex-wrap gap-2">
            <Dialog><DialogTrigger asChild><Button variant="outline">Dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Dialog contoh</DialogTitle><DialogDescription>Uji fokus dan Escape untuk menutup.</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose></DialogFooter></DialogContent></Dialog>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="outline">Alert dialog</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Konfirmasi contoh</AlertDialogTitle><AlertDialogDescription>Tidak ada data yang akan dihapus.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => toast.info("Konfirmasi contoh")}>Lanjutkan</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            <Sheet><SheetTrigger asChild><Button variant="outline">Sheet</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>Detail barang</SheetTitle><SheetDescription>Panel contoh.</SheetDescription></SheetHeader><div className="px-4 md:px-6">SKU-001 · Mie instan</div><SheetFooter><SheetClose asChild><Button variant="outline">Tutup</Button></SheetClose></SheetFooter></SheetContent></Sheet>
            <Popover><PopoverTrigger asChild><Button variant="outline">Tanggal</Button></PopoverTrigger><PopoverContent className="w-auto p-2"><Calendar mode="single" selected={date} onSelect={setDate} /></PopoverContent></Popover>
            <Popover><PopoverTrigger asChild><Button variant="outline">Cari perintah</Button></PopoverTrigger><PopoverContent className="p-2"><Command><CommandInput placeholder="Cari..." aria-label="Cari perintah" /><CommandList><CommandEmpty>Tidak ditemukan.</CommandEmpty><CommandGroup heading="Contoh"><CommandItem onSelect={() => toast.info("Barang masuk")}>Barang masuk</CommandItem><CommandItem onSelect={() => toast.info("Barang keluar")}>Barang keluar</CommandItem></CommandGroup></CommandList></Command></PopoverContent></Popover>
          </CardContent></Card>
          <Tabs defaultValue="summary"><TabsList><TabsTrigger value="summary">Ringkasan</TabsTrigger><TabsTrigger value="history">Riwayat</TabsTrigger></TabsList><TabsContent value="summary"><Card><CardContent>Konten ringkasan contoh.</CardContent></Card></TabsContent><TabsContent value="history"><Card><CardContent>Konten riwayat contoh.</CardContent></Card></TabsContent></Tabs>
        </section>


      </PageContainer>
    </main>
  )
}
