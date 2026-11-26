# E-Gudang

Sistem manajemen inventaris dan operasional gudang. Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui Radix Nova, Prisma dan MariaDB.

## Setup lokal

Gunakan versi Node/npm yang kompatibel dengan lockfile. Instal dengan `npm ci`, salin `.env.example` menjadi `.env`, lalu isi kredensial database lokal. Jalankan `npm run dev` dan buka http://localhost:3000.

## Dokumentasi

- [PRD](docs/PRD.md)
- [Global Design System](docs/DESIGN.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Design System QA](docs/DESIGN_SYSTEM_QA.md)

- [App Layout QA](docs/LAYOUT_QA.md)

Root mengarahkan ke /dashboard. App shell digunakan oleh tujuh halaman utama, sedangkan /login memiliki layout terpisah. Seluruh halaman masih placeholder; database schema, autentikasi dan fitur inventaris belum tersedia. Jangan gunakan aplikasi ini untuk data operasional nyata.
