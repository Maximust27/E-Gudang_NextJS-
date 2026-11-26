# Phase 2 — Global App Layout audit

## Scope

App shell responsif memakai design system yang sudah disetujui pada Phase 1.1 (monochrome). Tidak ada dependency tambahan, perubahan schema, atau implementasi bisnis. Seluruh menu tersedia untuk pengujian; ini bukan otorisasi produksi.

## Pengujian lokal

```powershell
git status
npx next typegen
npx tsc --noEmit
npx eslint .
npm run build
npm run dev
```

Buka http://localhost:3000. Hasil build dan pengujian browser untuk commit fase ini belum diverifikasi oleh implementor.

## Routing & navigation

- [ ] Root mengarahkan ke /dashboard.
- [ ] Ketujuh menu mengarah ke route PRD, termasuk /barang-masuk dan /barang-keluar.
- [ ] Satu menu aktif, selected surface netral, tema light/dark, aria-current sesuai route.
- [ ] Pengaturan berada di bagian bawah sidebar dan tetap dapat diakses saat collapsed.
- [ ] Breadcrumb dan judul browser mengikuti halaman.
- [ ] /login tidak memiliki sidebar atau navbar dashboard.
- [ ] Pencarian menu dapat difilter, dibuka dengan Enter, ditutup dengan Escape.
- [ ] Notifikasi dan menu akun menyatakan fitur belum terhubung; tidak ada data palsu.

## Layout & design

- [ ] Sidebar desktop 256px; collapsed 64px dengan tooltip dan nama aksesibel.
- [ ] Brand, header, sidebar dan active state mengikuti token monochrome tanpa palette lokal.
- [ ] Setelah collapse, hard refresh langsung menampilkan sidebar collapsed tanpa sempat expanded. Ulangi saat expanded dan saat berpindah route.
- [ ] Collapse/expand mempertahankan posisi horizontal ikon navigasi, logo, dan pengaturan; label fade tanpa pindah baris. Panel dan content spacer bergerak serempak selama 200ms.
- [ ] Uji refresh dengan cache dinonaktifkan dan jaringan lambat: fallback netral boleh muncul, tetapi sidebar tidak boleh muncul dengan state yang salah.
- [ ] Header 64px; tetap terlihat saat scroll tanpa menutupi konten.
- [ ] Padding PageContainer 24px desktop / 16px mobile; tidak ada padding ganda.
- [ ] Uji 320, 375, 768, 1024 dan 1440px; tidak ada scroll horizontal halaman.
- [ ] Mobile drawer dapat dibuka, ditutup, ditutup dengan Escape dan otomatis ditutup saat navigasi.
- [ ] Fokus kembali ke trigger saat drawer ditutup.
- [ ] Light/dark/system berfungsi dan preferensi tema tersimpan.
- [ ] Uji keyboard Tab, Shift+Tab, Ctrl+B, skip link, focus-visible, zoom 200%, reduced motion.
- [ ] Tombol icon dapat dikenali pembaca layar; kontrol utama memenuhi target ukuran desain.

## Batas fase

- Pencarian barang/SKU/barcode menunggu master data, notifikasi stok menunggu inventory engine, role dan akun menunggu autentikasi.
- Sidebar menggunakan state shadcn/ui dan cookie preferensi desktop (7 hari). Server layout membaca cookie di dalam Suspense boundary, lalu mengirim defaultOpen yang sama ke client. Tidak ada pemulihan state sidebar setelah hydration. Karena Cache Components tetap aktif, fallback loading netral dapat muncul sebelum shell siap; jangan render sidebar default yang salah. Mobile drawer tidak dipulihkan dalam keadaan terbuka.
- Tidak ada KPI, transaksi, atau user session palsu.
- Merge setelah pemeriksaan lokal dan audit visual lulus.

### Quality gate — app layout

Run `node --test tests/sidebar-preference.test.mjs tests/navigation.test.mjs` using Node 26 (native TypeScript stripping). These tests cover cookie defaults, restoration, the seven PRD routes, footer placement, nested matching and false prefix matches. Browser QA remains required: collapse animation, exact icon alignment, hard refresh, mobile drawer, focus return and accessibility. The Suspense boundary is retained for request-specific sidebar state; profile before changing its scope.
