# Phase 1 — Design System audit

Preview sementara: http://localhost:3000/ (dummy data, tidak menyimpan transaksi).

## Pengujian lokal (belum dijalankan pada commit implementasi ini)

```powershell
npm ci
npx next typegen
npx tsc --noEmit
npx eslint .
npm run build
npm run dev
```

- [ ] Light, dark, system, refresh dan browser console bebas hydration error.
- [ ] Computed font Geist; body 14/20; title 24/32; section 18/28; card 16/24; KPI 30/36.
- [ ] Button/input/select default 40px desktop, kontrol utama pointer coarse 44px; compact table/pagination 32px.
- [ ] Radius badge/control/card/dialog 6/8/12/16px.
- [ ] Card padding 16px mobile, 24px desktop; page padding sama; section gap 24px.
- [ ] Table header >=44px, row >=48px, angka rata kanan; overflow hanya pada tabel.
- [ ] Keyboard Tab, Shift+Tab, Enter, Escape; focus ring terlihat; dialog mengembalikan fokus.
- [ ] Uji lebar 320/375/768/1280px, zoom 200%, reduced motion.
- [ ] Kontras teks dan kontrol termasuk hover, selected, error, disabled (pengecualian WCAG berlaku).
- [ ] Toast, tooltip, dropdown, select, tabs, calendar, command, sheet, alert dialog dan sidebar primitive.
- [ ] Review diff dan pastikan tidak ada dependency baru atau rahasia.

Catatan: inspeksi source tidak menggantikan production build, browser QA atau audit aksesibilitas. Jangan merge sebelum semua pengujian relevan lulus. Preview dihapus/diganti saat fase app shell dimulai. Tidak ada fitur inventory, schema atau autentikasi yang diuji pada fase ini.
