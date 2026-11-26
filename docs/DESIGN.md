# E-Gudang — Global Design System & UI/UX Guidelines

| Atribut | Nilai |
| --- | --- |
| Versi | 1.1 — Monochrome revision |
| Design direction | Minimalist Monochrome Enterprise |
| Framework UI | shadcn/ui + Tailwind CSS |
| Font | Geist |
| Icon | Lucide React |
| Theme | Light & Dark Mode |
| Accessibility target | WCAG 2.2 AA |
| Dokumen terkait | [PRD.md](./PRD.md) · [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) |

> Dokumen ini merupakan kontrak desain untuk seluruh halaman, komponen, dan fitur E-Gudang sekarang maupun yang ditambahkan nanti. Nilai berikut adalah baseline produk yang disepakati sebagai acuan, bukan ukuran universal yang diwajibkan WCAG. Implementasi aktual wajib diuji.

## 1. Design principles

- **Consistency over decoration.** Fungsi yang sama memiliki gaya, ukuran, interaksi, dan terminologi yang sama.
- **Clarity first.** Prioritaskan informasi stok, status, serta tindakan utama; hindari dekorasi dan animasi berlebih.
- **Scan-first.** Fokus keyboard, input barcode, feedback, dan konfirmasi batch harus nyaman untuk pekerjaan berulang.
- **Single source of truth.** Design tokens global dan shared components adalah sumber utama, bukan styling per halaman.
- **Library-first.** Gunakan komponen shadcn/ui; kustomisasi baseline satu kali di level global. Jangan membuat ulang komponen standar.
- **Accessible by design.** Gunakan semantik, label, kontras, focus state, keyboard navigation, dan informasi selain warna.
- **Keep It Simple.** Jangan membuat abstraction, varian, token, atau komponen baru jika belum ada kebutuhan.

## 2. Global typography

Gunakan Geist melalui `next/font`, dengan fallback sans-serif. Base root 16px (100% mengikuti preferensi browser); ukuran body UI 14px. Semua ukuran dinyatakan sebagai padanan px pada root default dan diimplementasikan dengan rem agar mendukung zoom/pengaturan pengguna. Tidak boleh mengubah `html` menjadi 14px untuk mengecilkan seluruh UI.

| Semantic style | Size / line height | Weight | Penggunaan |
| --- | --- | --- | --- |
| Page title | 24 / 32 px | 600 | Dashboard, Data Barang, Barang Masuk, dan seluruh judul halaman |
| Section title | 18 / 28 px | 600 | Analisis Performa, judul section |
| Card title | 16 / 24 px | 600 | Chart card, panel informasi |
| Body | 14 / 20 px | 400 | Deskripsi, paragraf, input, isi tabel |
| Label / button | 14 / 20 px | 500 | Label form, navigasi, tombol, header tabel |
| Caption / helper | 12 / 16 px | 400 | Metadata, helper text, keterangan waktu |
| Badge | 12 / 16 px | 500 | Status dan metode FIFO/FEFO |
| KPI value | 30 / 36 px | 600 | Nilai KPI utama |

Aturan tambahan:

- Hirarki semantik: satu `h1` per halaman, `h2` untuk section, `h3` untuk judul panel bila sesuai; gaya visual tidak menggantikan struktur heading.
- Gunakan weight 400, 500, dan 600 sebagai standar. Tidak menggunakan 700/800 atau uppercase sebagai dekorasi tanpa kebutuhan.
- Warna body `foreground`; deskripsi pendukung `muted-foreground`; label/error menggunakan semantic token yang sesuai.
- KPI, stok, dan angka pada tabel menggunakan `tabular-nums` dan rata kanan pada kolom numerik. Format lokal `id-ID`: 12.480 CTN, 26 Nov 2026.
- Teks panjang wrap secara natural; ellipsis hanya ketika informasi lengkap bisa diakses pada detail. Jangan mengurangi ukuran teks hanya supaya muat.
- Gunakan class semantik yang didefinisikan di `typography.css`, misalnya `type-page-title`, `type-section-title`, `type-card-title`, `type-body`, `type-label`, `type-caption`, `type-badge`, `type-kpi`. Shared component menerapkan class ini otomatis.
- Pengecualian terdokumentasi: input pada mobile dapat memakai 16px untuk mencegah auto-zoom browser; ukuran heading tetap konsisten di semua halaman, kecuali breakpoint global memang memerlukannya.

## 3. Global spacing & layout rhythm

Gunakan skala 4px yang sama dengan skala spacing Tailwind standar (dengan root 16px).

| Token / Tailwind | Nilai | Fungsi |
| --- | --- | --- |
| `1` | 4px | Jarak mikro, label dan helper tertentu |
| `2` | 8px | Ikon-teks, label-input, grup tombol |
| `3` | 12px | Padding horizontal input, gap card/grid, padding card compact |
| `4` | 16px | Gap field, padding card default, padding halaman mobile |
| `5` | 20px | Padding alternatif bila diperlukan |
| `6` | 24px | Padding halaman desktop, gap section |
| `8` | 32px | Pemisah section besar |
| `10` | 40px | Jarak layout besar / ukuran control |
| `12` | 48px | Jarak layout besar / min tinggi row |
| `16` | 64px | Tinggi header global |

| Elemen | Default |
| --- | --- |
| Padding konten desktop | 24px (`p-6`) |
| Padding konten mobile | 16px (`p-4`) |
| Jarak antar section | 24px (`gap-6`) |
| Jarak antar card / grid | 12px (`gap-3`), 16px untuk grid form |
| Padding card | 16px default, 12px untuk varian `sm` (desktop dan mobile) |
| Form field gap | 16px |
| Label ke input | 8px |
| Error/helper ke field | 4px |
| Ikon ke teks / grup tombol | 8px |
| Table cell padding | 12px horizontal, 8px vertikal; row tetap min 48px |

Gunakan `gap`, grid dan flex sebagai default, bukan margin ad-hoc pada setiap child. Shared layout mengelola jarak luar, komponen mengelola jarak dalam. Jangan menggandakan padding halaman + padding wrapper. Arbitrary value seperti `gap-[13px]`, `p-[17px]`, atau `mt-[23px]` dilarang untuk layout rutin. Pengecualian teknis (misalnya barcode cetak dalam mm atau stroke SVG) dicatat di komponen terkait.

## 4. Global radius, border & elevation

| Token semantik | Nilai | Penggunaan |
| --- | --- | --- |
| `radius-sm` | 6px | Badge, elemen kecil |
| `radius-md` | 8px | Button, Input, Select, Dropdown, menu |
| `radius-lg` | 12px | Card, container tabel, panel |
| `radius-xl` | 16px | Dialog/modal |
| `radius-full` | 9999px | Avatar, elemen yang memang berbentuk bulat |

- Base `--radius` = 8px; map radius semantik secara eksplisit ke theme Tailwind agar komponen shadcn/ui tidak menghasilkan radius berbeda dari baseline.
- Border/divider standar 1px dengan token `border`. Gunakan shadcn/ui `Separator` atau border semantik; bukan `<div>` dengan garis/warna hardcoded.
- Card normal: border tipis, tanpa shadow berat. Dropdown, popover, dialog dapat memakai elevasi lembut yang distandardisasi di komponen UI.
- Hindari dekorasi gradient, glassmorphism, shadow berlapis, dan semua komponen berbentuk pill.

## 5. Global component sizing

| Elemen | Ukuran desktop default |
| --- | --- |
| Button / Input / Select / Combobox | Tinggi 40px (minimum jika konten wrap) |
| Icon button | 40 × 40px |
| Compact control (hanya konteks tabel/pagination) | 32px, tetap memenuhi target aksesibilitas |
| Table header | Min 44px |
| Table row | Min 48px |
| Icon inline | 16px |
| Icon navigasi / standar | 20px |
| Icon besar | 24px |
| Header/navbar | 64px |
| Sidebar expanded | 256px |
| Sidebar collapsed | 64px (usulan baseline) |

Pada layar sentuh, target kontrol utama minimal 44 × 44px. Untuk target kecil lain, verifikasi target minimum WCAG 2.2 AA (umumnya 24 × 24 CSS px atau pengecualian yang berlaku). Jangan mengecilkan ukuran interaksi hanya untuk menampung lebih banyak data. Button/input yang membutuhkan konten dua baris dapat bertambah tinggi, bukan memotong teks.

## 6. Global semantic color system

Palette revisi: monochrome netral (putih, abu-abu, charcoal), sidebar mengikuti tema, dan hijau sebagai aksen data. Referensi visual pengguna menjadi inspirasi, bukan salinan identitas produk lain. Primary action menggunakan hitam pada light mode dan putih pada dark mode; menu aktif memakai surface netral lembut. Warna semantik status tetap terpisah. Definisikan pasangan foreground/background agar status dapat dibaca dengan jelas. Nilai di bawah adalah baseline untuk token; semuanya perlu verifikasi kontras pada kombinasi nyata sebelum release.

| Token | Light | Dark | Fungsi |
| --- | --- | --- | --- |
| `background` | `#F2F2F2` | `#171717` | Area halaman |
| `foreground` | `#171717` | `#F5F5F5` | Teks utama |
| `card` / `popover` | `#FFFFFF` | `#222222` | Surface |
| `card-foreground` / `popover-foreground` | `#171717` | `#F5F5F5` | Teks surface |
| `primary` | `#171717` | `#F5F5F5` | Action utama |
| `primary-foreground` | `#FFFFFF` | `#171717` | Teks action |
| `secondary` / `muted` | `#EEEEEE` | `#303030` | Surface sekunder |
| `secondary-foreground` | `#171717` | `#F5F5F5` | Teks sekunder |
| `muted-foreground` | `#595959` | `#B0B0B0` | Deskripsi dan metadata |
| `accent` | `#E8E8E8` | `#333333` | Hover, selected surface |
| `accent-foreground` | `#171717` | `#F5F5F5` | Teks accent |
| `border` | `#E4E4E4` | `#373737` | Divider/card border |
| `input` | `#858585` | `#818181` | Batas input yang terlihat |
| `ring` | `#171717` | `#F5F5F5` | Keyboard focus |
| `success` | `#15803D` | `#6ECF97` | Aksen sukses |
| `success-surface` | `#F0FDF4` | `#14532D` | Badge sukses |
| `success-foreground` | `#166534` | `#DCFCE7` | Teks sukses |
| `warning` | `#B45309` | `#FBBF24` | Aksen perhatian |
| `warning-surface` | `#FFFBEB` | `#78350F` | Badge perhatian |
| `warning-foreground` | `#92400E` | `#FEF3C7` | Teks perhatian |
| `destructive` | `#B91C1C` | `#FCA5A5` | Action berbahaya / error |
| `destructive-foreground` | `#FFFFFF` | `#450A0A` | Teks action berbahaya |
| `danger-surface` | `#FEF2F2` | `#7F1D1D` | Badge error / expired |
| `danger-foreground` | `#991B1B` | `#FEE2E2` | Teks error |
| `sidebar` | `#FCFCFC` | `#1C1C1C` | Surface sidebar |
| `sidebar-foreground` | `#404040` | `#D4D4D4` | Teks sidebar |
| `sidebar-primary` | `#EBEBEB` | `#363636` | Menu aktif |
| `sidebar-primary-foreground` | `#171717` | `#FAFAFA` | Teks menu aktif |
| `sidebar-accent` | `#F0F0F0` | `#2B2B2B` | Hover sidebar |
| `sidebar-accent-foreground` | `#171717` | `#F5F5F5` | Teks hover sidebar |
| `sidebar-border` | `#E4E4E4` | `#373737` | Divider sidebar |
| `sidebar-ring` | `#525252` | `#D4D4D4` | Focus sidebar |
| `chart-1` | `#16834A` | `#6ACF95` | Barang masuk |
| `chart-2` | `#777777` | `#999999` | Barang keluar |

Gunakan aksen `success`/`warning` untuk ikon/grafik yang telah diuji; gunakan pasangan `*-surface` dan `*-foreground` untuk badge dan teks status. Jangan mengasumsikan teks putih dapat dibaca di semua aksen. `border` untuk divider dekoratif tidak selalu cukup untuk batas kontrol; gunakan `input`/focus ring dan verifikasi kontras komponen interaktif.

### Mapping status

| Status | Semantic style |
| --- | --- |
| Tersedia, berhasil, selesai | Success |
| Menipis, mendekati expired, perlu diperiksa | Warning |
| Habis, expired, error | Danger/destructive sesuai konteks |
| FIFO, FEFO, draft, nonaktif | Neutral/muted; label teks tetap jelas |

Jangan mengandalkan warna sebagai satu-satunya pembeda. Status memiliki label teks dan ikon bila dibutuhkan. Warna barang masuk/keluar pada chart tetap konsisten dengan legend di seluruh halaman; hijau/merah tidak wajib untuk volume yang sama-sama normal.

## 7. Component standards

Gunakan komponen shadcn/ui yang sudah tersedia. Standarkan variant dan size sekali pada `components/ui/`; jangan mengubahnya pada setiap route.

| Komponen | Standar |
| --- | --- |
| Button | Primary untuk aksi utama, secondary/outline untuk alternatif, ghost untuk aksi ringan, destructive untuk tindakan berisiko |
| Input / Select / Combobox | Label eksplisit, ukuran default seragam, placeholder hanya contoh, error inline |
| Card | Radius 12px, padding responsif, border, header/title terstandardisasi |
| Table | Header dan row seragam, angka rata kanan, status badge, hover lembut, action menu konsisten |
| Dialog / AlertDialog | Radius 16px, judul/deskripsi jelas, aksi batal + konfirmasi; destructive hanya bila diperlukan |
| Sheet | Detail barang/batch/riwayat jika konten tidak memerlukan halaman penuh |
| Badge | Font 12px/500, radius 6px, semantic variant; bukan indikator warna tanpa label |
| Tooltip | Informasi tambahan, bukan pengganti label atau satu-satunya akses informasi |
| Sonner | Feedback transaksi berhasil/gagal; error field tetap ditampilkan inline |
| Skeleton | Meniru dimensi layout konten; jangan membuat layout shift besar |
| Chart | shadcn/ui Chart + Recharts, axis dan legend konsisten, tooltip unit CTN, ringkasan teks bila perlu |

Satu aksi utama per konteks. Aksi seperti tambah barang, transaksi baru, atau simpan memiliki label yang konsisten. Aksi konfirmasi berisiko menjelaskan dampaknya. Gunakan dialog untuk form singkat; transaksi multi-item menggunakan halaman sendiri agar ruang scanning cukup.

## 8. Shared components — reuse sebelum membuat baru

| Shared component | Kontrak |
| --- | --- |
| `PageContainer` | Mengatur padding konten dan gap antar section; tidak ada padding ganda pada route |
| `PageHeader` | `title`, `description`, `actions`; typography dan alignment tetap |
| `SectionHeader` | Judul section, deskripsi/aksi opsional |
| `StatCard` | Label, angka dengan tabular-nums, unit, icon opsional |
| `DataTable` | Search/filter, server pagination/sort, loading, empty, row actions; kolom didefinisikan per fitur |
| `TableToolbar` | Search dan filter di kiri, action sesuai layout; wrap pada mobile |
| `StatusBadge` | Mapping status terpusat ke variant semantik |
| `FormField` | Label, control, helper, error, accessible association |
| `EmptyState` | Judul jelas, deskripsi singkat, action opsional |
| `LoadingState` | Skeleton standar sesuai jenis konten |
| `ConfirmDialog` | Konfirmasi dengan aksi pending, error, batal/lanjut |
| `BarcodeInput` | Fokus, input manual, terminator scanner, hasil scan, feedback |
| `ChartCard` | Header/title, deskripsi/unit, filter/legend jika diperlukan, chart responsive |

Buat shared component ketika dibutuhkan oleh alur nyata. Jangan membangun semua wrapper terlebih dahulu jika komponen shadcn/ui langsung sudah mencukupi. Yang wajib sejak awal: layout, typography, theme, page header dan primitive UI baseline.

## 9. Application shell & responsive layout

- Desktop: sidebar kiri 256px, header 64px, konten utama fleksibel. Sidebar collapsible 64px dengan label yang tetap bisa diakses melalui tooltip/accessible name.
- Mobile (di bawah breakpoint `md` sebagai baseline): sidebar menjadi Sheet/Drawer, header tetap ringkas, konten menggunakan padding 16px, aksi tidak terpotong.
- Sidebar: Dashboard; Data Barang, Barang Masuk, Barang Keluar, Stok Opname; Laporan; Pengaturan. Menu aktif satu, sesuai URL dan role.
- Header: toggle sidebar, pencarian barang (nama/SKU/barcode), notifikasi, theme toggle, user menu; sembunyikan elemen nonesensial pada layar sempit dengan akses alternatif.
- Dashboard: empat KPI dalam grid 1 kolom mobile sempit, 2 kolom pada layar menengah, 4 kolom desktop; chart penuh; dua panel performa berdampingan pada desktop dan bertumpuk pada mobile.
- Halaman tabel: judul/action, toolbar, tabel, pagination. Gunakan horizontal scroll pada container tabel jika diperlukan, bukan scroll horizontal seluruh halaman.
- Form transaksi: informasi transaksi dan scan input terlihat jelas; daftar item dan alokasi lot di bawahnya; ringkasan jumlah dan tombol konfirmasi mudah dijangkau. Tidak ada auto-submit saat scanner mengirim Enter.
- Detail: gunakan header, ringkasan status, lalu tab untuk informasi tambahan. Hindari nesting card yang tidak diperlukan.

Breakpoint standar Tailwind dipakai secara konsisten (`sm`, `md`, `lg`, `xl`); jangan membuat breakpoint berbeda untuk halaman dengan kebutuhan layout yang sama.

## 10. Interaction, accessibility & state

- Semua kontrol dapat dioperasikan dengan keyboard; focus ring terlihat, tidak tertutup sticky header. Modal mengelola fokus dan kembali ke pemicu setelah ditutup.
- Gunakan label form, accessible name untuk icon-only button, `aria-current` pada navigasi, dan pengumuman status scan yang tidak berlebihan.
- Kontras target: 4.5:1 untuk teks normal, 3:1 untuk teks besar yang memenuhi definisi WCAG, dan 3:1 pada bagian komponen/grafik yang diperlukan untuk memahami informasi sesuai kriteria yang berlaku.
- Jangan menghapus outline tanpa pengganti focus indicator yang terlihat. Jangan mengunci zoom browser. Dukung reflow pada layar kecil dan zoom pengguna.
- Motion ringan (sekitar 120–200ms untuk hover/transition); ikuti `prefers-reduced-motion`. Tidak ada animasi dashboard yang mengganggu scanning.
- Sediakan state loading, empty, error, disabled, hover, focus-visible, pending, success. Pending mencegah submit ganda tetapi server tetap menjaga idempotensi.
- Scan error tidak menghapus item yang sudah valid. Kembalikan fokus ke input scan setelah feedback kecuali operator sedang mengisi field lain atau membuka dialog.
- Gunakan copywriting Indonesia yang singkat dan konkret: "Stok tidak mencukupi", "Batch tidak sesuai", "Transaksi berhasil disimpan". Jangan tampilkan stack trace.
- Chart memakai legend, label, tooltip, serta alternatif ringkasan data; jangan menyampaikan perbedaan hanya lewat warna.

## 11. Sumber tunggal implementasi

```text
(project root)/
├── app/globals.css             # Entry global; Tailwind, theme mapping, base styles
├── styles/
│   ├── tokens.css              # Nilai :root dan .dark; radius, spacing/layout, warna
│   └── typography.css          # Class semantik yang menggunakan token typography
├── components/
│   ├── ui/                     # Primitive shadcn/ui yang distandardisasi
│   ├── shared/                 # Komponen aplikasi reusable
│   ├── providers/              # Theme provider
│   └── layout/                 # App shell, sidebar, header, navigasi
└── lib/utils.ts                # cn() dan helper ringan
```

- `tokens.css` menjadi sumber nilai; `globals.css` mengimpor dan memetakan nilai itu ke Tailwind/shadcn sesuai versi yang dipasang (misalnya `@theme inline` jika versi Tailwind mendukung). Jangan mendefinisikan nilai warna/radius yang sama pada dua file.
- Gunakan CSS variables global untuk font size/line height/weight semantik, layout dimension dan warna. Gunakan skala spacing Tailwind yang sesuai 4px, bukan membuat skala duplikat tanpa kebutuhan.
- Class typography menggunakan token global. Primitive UI menggunakan token semantik seperti `bg-background`, `text-foreground`, `border-border`, `rounded-md`; jangan hardcode hex/ukuran per halaman.
- `next/font` mengatur font Geist di root layout; `next-themes` mengelola pilihan light/dark/system tanpa duplikasi palette.
- Jangan edit komponen vendor secara acak. Ketika shadcn/ui di-update, review perubahan agar customisasi baseline tidak hilang.
- CSS modul/custom class hanya jika diperlukan untuk behavior spesifik (misalnya layout print barcode), dan tetap menggunakan token bila relevan.

### Catatan implementasi Phase 1

- Token tambahan `primary-hover` dan `destructive-hover` menjaga kontras teks saat hover. Light: #333333 / #991B1B; dark: #D9D9D9 / #FECACA.
- Varian ukuran Nova tetap tersedia untuk kompatibilitas. Ukuran ringkas hanya dipakai untuk pagination, kalender, kontrol tertanam dan konteks padat yang memang memerlukannya. Kontrol utama menggunakan token 40px, atau minimal 44px pada perangkat pointer coarse.
- Preview sementara tersedia di `/` selama audit fase ini. Data pada preview adalah dummy dan tidak terhubung database. Setelah disetujui, ganti root preview saat implementasi app shell.
- Validasi scanner, transaksi, dan autentikasi belum berlaku pada fase desain.

### Revisi visual monochrome (Phase 1.1)

- Pertahankan Geist dan semua ukuran typography, control, sidebar, header, radius serta target aksesibilitas dari baseline. Heading/KPI menggunakan tracking negatif ringan melalui token typography.
- Card putih di atas canvas netral terang; dark memakai card charcoal yang sedikit lebih terang dari canvas. Border tipis, tanpa shadow dekoratif. Card kompak berpadding 12px; card default 16px. Grid KPI/panel memakai gap 12px.
- Barang masuk memakai hijau, barang keluar abu-abu; legend dan unit CTN tetap wajib. Hijau bukan berarti transaksi masuk selalu baik, dan abu-abu bukan berarti keluar buruk.
- Sidebar mengikuti tema dengan state aktif netral, bukan biru solid. Implementasi app shell di branch terpisah akan menyesuaikan token setelah revisi ini disetujui.
- Komponen input memakai surface card/transparent, border tetap cukup jelas untuk operasi keyboard dan scanning. Jangan mengecilkan ukuran interaksi untuk menyamai screenshot.
- Preview dashboard di root hanya fixture visual, tanpa koneksi database dan bukan implementasi dashboard bisnis.

### Implementasi app shell (Phase 2)

- App shell digunakan oleh tujuh route dashboard melalui `app/(dashboard)/layout.tsx`; login memiliki layout terpisah. Root mengarahkan ke dashboard selama autentikasi belum tersedia.
- `components/layout/navigation.ts` adalah sumber tunggal sidebar, breadcrumb dan pencarian menu. Semua tujuh menu tersedia untuk pengujian; penyaringan role dan otorisasi server menunggu fase autentikasi.
- Sidebar desktop memakai token 256/64px, mobile memakai Sheet dengan lebar maksimum 18rem, navbar memakai token 64px. Padding konten dikelola PageContainer.
- Pencarian menu berfungsi sebagai navigasi; pencarian nama/SKU/barcode, notifikasi stok dan akun nyata belum terhubung. Tidak ada data operasional atau pengguna palsu.
- Preview Phase 1.1 digantikan oleh root redirect setelah merge desain; source preview historis tetap tersedia di commit `cae9176`. Pengujian layout mengikuti `LAYOUT_QA.md`.

## 12. UI/UX review checklist — wajib sebelum merge

- [ ] Page title, section title, body, caption, button, KPI menggunakan typography global yang sesuai fungsi.
- [ ] Padding, gap, margin, divider, radius, border, icon dan control sizing konsisten.
- [ ] Tidak ada hardcoded palette atau arbitrary typography/spacing/radius baru tanpa alasan terdokumentasi.
- [ ] Memakai shadcn/ui/shared component yang sudah tersedia; tidak ada komponen fungsi sama yang diduplikasi.
- [ ] Aksi utama jelas, form error dan konfirmasi dapat dipahami, status memiliki teks.
- [ ] Tabel, chart, empty/loading/error state dan angka diformat konsisten.
- [ ] Light/dark, layar mobile/desktop, zoom dan keyboard navigation diuji.
- [ ] Kontras aktual dan target interaksi diverifikasi; fokus dapat dilihat; tidak ada konten penting yang terpotong.
- [ ] Scanner Enter tidak mem-posting transaksi tanpa konfirmasi; fokus dan feedback berfungsi.
- [ ] Perubahan sistem desain dilakukan di token/komponen global dan direview pada halaman terdampak.

## 13. Governance

Halaman baru mengikuti layout dan komponen di atas secara default. Jika benar-benar membutuhkan varian baru, ubah satu sumber token/komponen, dokumentasikan alasannya, lalu cek dampak ke semua halaman. Tidak boleh ada perubahan lokal sekadar untuk menyesuaikan tampilan satu halaman.

Ukuran typography, spacing, radius, warna, breakpoint, dan sidebar collapsed di dokumen ini adalah keputusan baseline desain E-Gudang. Ini bukan klaim sertifikasi aksesibilitas atau hasil pengujian visual; pengujian dilakukan setelah UI diimplementasikan. Jika ada perubahan desain setelah baseline disetujui, perbarui DESIGN.md dan shared components bersama-sama.
