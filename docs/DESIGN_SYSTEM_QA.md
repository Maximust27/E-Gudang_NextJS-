# Phase 1.1 — Monochrome Design System audit

Preview Phase 1.1 tersedia pada commit `cae9176d23007ea07d379401f6d0f096edf04c65` di branch design system. Pada branch app layout, root telah diganti dengan redirect. Untuk audit app shell, gunakan [LAYOUT_QA.md](./LAYOUT_QA.md).

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
- [ ] Card padding 16px default / 12px compact; page padding 16px mobile / 24px desktop; section gap 24px; grid card gap 12px.
- [ ] Table header >=44px, row >=48px, angka rata kanan; overflow hanya pada tabel.
- [ ] Keyboard Tab, Shift+Tab, Enter, Escape; focus ring terlihat; dialog mengembalikan fokus.
- [ ] Uji lebar 320/375/768/1280px, zoom 200%, reduced motion.
- [ ] Kontras teks dan kontrol termasuk hover, selected, error, disabled (pengecualian WCAG berlaku).
- [ ] Toast, tooltip, dropdown, select, tabs, calendar, command, sheet, alert dialog dan sidebar primitive.
- [ ] Sidebar mengikuti tema; active state netral; primary hitam/putih; chart hijau/abu-abu.
- [ ] Audit preview dashboard dummy dibandingkan referensi pengguna pada desktop dan mobile.
- [ ] Review diff dan pastikan tidak ada dependency baru atau rahasia.

Catatan: inspeksi source tidak menggantikan production build, browser QA atau audit aksesibilitas. Jangan merge sebelum semua pengujian relevan lulus. Preview dihapus/diganti saat fase app shell dimulai. Tidak ada fitur inventory, schema atau autentikasi yang diuji pada fase ini.

### Contrast check (static token pairs, revision 1.1)

| Pair | Light | Dark |
| --- | ---: | ---: |
| Body / background | 16.01:1 | 16.44:1 |
| Primary text / primary | 17.93:1 | 16.44:1 |
| Muted text / card | 7.00:1 | 7.34:1 |
| Input border / card | 3.69:1 | 4.08:1 |
| Sidebar text / sidebar | 10.11:1 | 11.50:1 |
| Sidebar active text / selected surface | 15.04:1 | 11.58:1 |
| Inbound chart / card | 4.80:1 | 8.31:1 |
| Outbound chart / card | 4.48:1 | 5.58:1 |

These ratios were calculated from hex color values, not measured from the rendered page. Verify hover, focus, disabled, opacity, browser rendering and actual chart separation before merge. Sidebar selected state should also be conveyed by aria-current/label in the layout branch.
