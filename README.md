# E-Gudang

Sistem manajemen inventaris dan operasional gudang. Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui Radix Nova, Prisma dan MariaDB.

## Setup lokal

Gunakan versi Node/npm yang kompatibel dengan lockfile. Instal dengan `npm ci`, salin `.env.example` menjadi `.env`, lalu isi kredensial database lokal. Jalankan `npm run dev` dan buka http://localhost:3000.

## Dokumentasi

- [PRD](docs/PRD.md)
- [Global Design System](docs/DESIGN.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Design System QA](docs/DESIGN_SYSTEM_QA.md)

Pada feature branch design system, root page menampilkan preview komponen dengan data dummy. Database schema, autentikasi, app shell dan fitur inventaris dikerjakan pada fase berikutnya. Jangan gunakan data operasional nyata pada preview.
