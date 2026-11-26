# E-Gudang — Project Structure

App Router berada di root repository, tanpa folder src. Struktur berikut membedakan file yang sudah digunakan pada fase app layout dan direktori yang dibuat ketika fiturnya diperlukan.

```text
app/
  (auth)/
    layout.tsx
    login/page.tsx
  (dashboard)/
    layout.tsx
    dashboard/page.tsx
    data-barang/page.tsx
    barang-masuk/page.tsx
    barang-keluar/page.tsx
    stok-opname/page.tsx
    laporan/page.tsx
    pengaturan/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  ui/
  providers/theme-provider.tsx
  layout/
    navigation.ts
    app-sidebar.tsx
    app-header.tsx
    menu-search.tsx
    theme-switcher.tsx
  shared/
    page-container.tsx
    page-header.tsx
    section-header.tsx
styles/
  tokens.css
  typography.css
hooks/
lib/
  sidebar-preference.ts
tests/
  navigation.test.mjs
  sidebar-preference.test.mjs
prisma/
  schema.prisma
docs/
  PRD.md
  DESIGN.md
  PROJECT_STRUCTURE.md
  DESIGN_SYSTEM_QA.md
  LAYOUT_QA.md
AGENTS.md
prisma7.config.ts
package.json
package-lock.json
```

Root layout mengelola font dan providers. Route group dashboard memiliki app shell bersama; route auth memakai layout terpisah. Root sementara mengarahkan ke dashboard. Buat app/api, actions, services, schemas, types dan folder lain saat benar-benar diperlukan. Import alias `@/*` mengarah ke root.

Design tokens adalah sumber nilai CSS; komponen UI hanya mengonsumsi token. Shared components menangani pola aplikasi berulang. Validasi bisnis dan operasi database tetap di server. Prisma client generated tidak dikomit. Tidak ada migration pada fase ini.
