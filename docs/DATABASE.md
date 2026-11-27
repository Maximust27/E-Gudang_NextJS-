# E-Gudang — Database V1

Status: candidate untuk audit Phase 3. Acuan: [PRD.md](./PRD.md), khususnya bagian 4–6. Provider Prisma `mysql`, adapter MariaDB, satu gudang. Tidak ada migration yang dijalankan pada database operasional oleh implementor. CI memakai database MariaDB 11.4 terisolasi; versi Laragon yang digunakan reviewer harus diverifikasi.

## Entity relationship diagram

```mermaid
erDiagram
  USERS ||--o{ TRANSACTIONS : posts
  USERS ||--o{ STOCK_OPNAMES : creates
  USERS o|--o{ STOCK_OPNAMES : approves
  USERS ||--o{ ACTIVITY_LOGS : records
  CATEGORIES ||--o{ PRODUCTS : groups
  PRODUCTS ||--o{ INVENTORY_BATCHES : has
  LOCATIONS ||--o{ INVENTORY_BATCHES : stores
  SUPPLIERS o|--o{ TRANSACTIONS : supplies
  TRANSACTIONS ||--o{ TRANSACTION_ITEMS : contains
  PRODUCTS ||--o{ TRANSACTION_ITEMS : references
  TRANSACTION_ITEMS ||--o{ INVENTORY_BATCHES : originates
  TRANSACTION_ITEMS ||--o{ STOCK_MOVEMENTS : records
  INVENTORY_BATCHES ||--o{ STOCK_MOVEMENTS : affects
  STOCK_OPNAMES ||--o{ STOCK_OPNAME_ITEMS : counts
  INVENTORY_BATCHES ||--o{ STOCK_OPNAME_ITEMS : measured
  TRANSACTIONS o|--o| TRANSACTIONS : reverses
  STOCK_OPNAMES o|--o| TRANSACTIONS : adjusts
  SETTINGS {
    string key PK
    int value
  }
```

## Model dan keputusan

| Model | Peran |
| --- | --- |
| User | Email unik, password hash, ADMIN/OPERATOR, aktif/nonaktif. Auth belum diimplementasikan; tidak ada akun default. |
| Category | Nama unik, metode default FIFO/FEFO. |
| Product | SKU/barcode unik, kategori, override metode opsional, isi CTN opsional, minimum stok. Tidak ada saldo total. |
| Supplier | Nama, kode opsional unik, status. Supplier wajib untuk posting IN. |
| Location | Kode rak unik, nama, status. |
| InventoryBatch | Lot internal unik, item asal, produk, lokasi, expiry, saldo CTN, version, blokir dengan alasan. |
| Transaction | IN/OUT/ADJUSTMENT/REVERSAL, DRAFT/POSTED, nomor unik, user, data penerimaan/tujuan, idempotency dan referensi koreksi. |
| TransactionItem | Produk dan jumlah CTN positif; snapshot isi karton opsional. |
| StockMovement | Alokasi dan ledger dalam satu tabel, delta signed, saldo sebelum/sesudah. Satu movement per pasangan item/lot. |
| StockOpname | DRAFT/SUBMITTED/CONFIRMED, pembuat/pemeriksa dan waktu. |
| StockOpnameItem | Satu baris per lot per sesi; snapshot saldo/version, hitungan nullable sampai diisi, alasan selisih. |
| ActivityLog | User, aksi, entity reference, metadata JSON tanpa rahasia. |
| Setting | Key dan integer positif; near_expiry_days dan dead_stock_days. |

Semua ID numerik menggunakan signed INT auto increment (kapasitas sekitar 2,1 miliar per tabel; tinjau jika skala berubah). PK Setting adalah string key. Kolom teks berukuran terbatas bila relevan; barcode string tidak menghilangkan nol depan. MariaDB menggunakan InnoDB dan utf8mb4_unicode_ci; kode unik bersifat case-insensitive, normalisasi trim/kasus dilakukan pada validasi fitur. Namespace `LOT-` dicadangkan untuk kode internal; barcode SKU tidak boleh menggunakan prefix tersebut. Foto/brand opsional ditunda sampai benar-benar diperlukan. Tidak ada serial karton, tabel warehouse, purchase order, session Auth.js atau tabel alokasi tambahan.

## Aturan saldo dan integritas

### Dijaga database
- Foreign key RESTRICT untuk referensi historis; unik untuk email, SKU, barcode, kode lot, nomor transaksi/opname, idempotency key, reversal_of_id dan opname_id.
- CHECK: saldo dan versi lot >= 0, jumlah item > 0, isi karton > 0 bila terisi, minimum stok >= 0, saldo ledger sebelum/sesudah >= 0, delta nonnol, saldo sesudah = sebelum + delta.
- POSTED membutuhkan waktu, idempotency key dan hash payload; IN membutuhkan supplier dan waktu penerimaan; OUT membutuhkan tujuan; reversal dan posted adjustment membutuhkan alasan; opname yang berubah membutuhkan alasan.
- Nomor reversal asli dan referensi opname unik; opname line unik per sesi/lot; ledger line unik per item/lot. Opname status mengharuskan timestamp/pemeriksa yang sesuai.
- Tanggal expiry memakai SQL DATE. Timestamp memakai DATETIME(3), adapter memakai timezone +00:00; hari bisnis dihitung di Asia/Jakarta. Uji round-trip tanggal pada adapter nyata.

### Wajib dijaga inventory engine (belum diimplementasikan)
- Semua penulis stok memakai satu interactive transaction; lock produk secara ID ascending lalu lot terkait secara deterministik. Baca ulang saldo/metadata setelah lock, validasi dan baru tulis saldo, version dan ledger atomik. Pertimbangkan deadlock retry terukur. Jangan melakukan query stok di luar koneksi transaksi untuk keputusan posting.
- Metode efektif: override SKU jika valid, jika tidak default kategori. Lot ber-expiry wajib FEFO; expiry <= hari lokal hari ini tidak eligible; lot blocked atau saldo nol tidak eligible. FIFO: received_at, id. FEFO: expiry_date, received_at, id. Server memeriksa ulang alokasi hasil scan sebelum posting.
- Product/receipt item/movement harus merujuk SKU yang sama, item asal adalah penerimaan IN atau rekonsiliasi lot baru yang secara eksplisit diotorisasi Admin. Validasi jenis sumber, SKU aktif, lokasi valid, dan supplier aktif saat operasi. Lot origin/lokasi tidak diedit sehingga histori tetap dapat ditelusuri.
- Total item CTN = jumlah magnitudo mutasi lot untuk item tersebut; saldo batch = total delta ledger, termasuk reversal. Ledger dibuat append-only pada lapisan layanan, bukan diproteksi dari semua SQL manual oleh trigger. Jangan membuat endpoint edit/delete saldo dan ledger. Status blocked tidak menggantikan proses adjustment barang rusak/expired.
- DRAFT/form tidak memiliki efek stok. Draft UI V1 belum memerlukan persistensi detail scan terpisah. Buat lot dan movement hanya pada posting dalam transaksi.
- Idempotency key harus dinormalisasi, hash SHA-256 atas payload kanonis beserta konteks operasi/user, retry identik mengembalikan hasil sebelumnya; mismatch ditolak. UNIQUE key saja tidak cukup.
- Reversal hanya untuk transaksi efektif yang valid, bukan reversal lain atau dirinya sendiri. Baca ulang lot asli, validasi delta kebalikan dan saldo, simpan reason, jangan ubah histori. Status efektif diturunkan dari relasi reversal POSTED; draft reversal tidak mengubah analitik. Buat reversal saat konfirmasi, bukan menyimpan draft reversal yang mengunci UNIQUE referensi.
- Opname harus diajukan dulu, Admin mengonfirmasi sekali, seluruh item dihitung (0 valid), snapshot saldo/version dicek, adjustment dibuat jika selisih; tanpa selisih cukup tutup sesi. Reject snapshot usang, jangan menimpa saldo terkini.
- Role dan status user diverifikasi ulang di server. Password/token tidak boleh masuk log. Pengaturan, metode produk, blokir, dan master dengan saldo memiliki aturan tambahan sesuai PRD.
- Constraint row-level bukan pengganti transaction protocol, otorisasi, atau tes concurrency. Uji dua operator, stale allocation, retry, reversal dan rollback bisnis pada fase inventory engine.

## Indeks baseline

| Query | Indeks |
| --- | --- |
| Scan produk / lot | UNIQUE carton_barcode / internal_lot_code |
| FIFO | product_id, is_blocked, received_at, id |
| FEFO | product_id, is_blocked, expiry_date, received_at, id |
| Expiry alert | expiry_date |
| Master filter | category_id, is_active; is_active, name |
| Transaksi harian | type, status, posted_at; posted_at |
| Riwayat SKU | transaction_items(product_id, transaction_id) |
| Ledger lot | batch_id, created_at, id |
| Audit | entity_type, entity_id, created_at; user_id, created_at |

Indeks relasi lain mendukung foreign key dan detail. Tidak ada klaim performa optimal; gunakan EXPLAIN dan data realistis sebelum menambah indeks atau cache.

## Setup dan audit lokal

Pastikan branch `feat/database-schema`, working tree bersih, Laragon aktif, dan kredensial di .env (jangan commit .env). Prisma menggunakan file konfigurasi aktual `prisma7.config.ts` secara eksplisit. URL lokal TCP biasa: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`; encode karakter khusus pada kredensial. Query option/SSL URL belum didukung oleh parser runtime baseline lokal; konfigurasi deployment aman direview terpisah. Pool baseline lima koneksi per proses, bukan hasil tuning.

1. Sebelum mengubah DB: `npm run db:validate`, `npm run db:generate`, `npm run check`.
2. Review SQL migration. Jalankan `SELECT VERSION(), @@session.time_zone, @@sql_mode;` dan `SHOW TABLES;` melalui MariaDB. Pastikan target merupakan database kosong yang memang dikhususkan untuk E-Gudang; backup jika ada data. Jika sudah berisi tabel, berhenti dan review drift/baselining; jangan reset.
3. Untuk uji integrasi, buat database kosong terpisah `e_gudang_test`. Di PowerShell override sementara DATABASE_URL dengan URL yang benar untuk database test (gunakan kredensial lokal sendiri). Jalankan:
   ```powershell
   npm run db:migrate
   npm run db:seed
   npm run db:seed
   npm run db:smoke
   npm run db:status
   npx prisma migrate diff --config prisma7.config.ts --from-config-datasource --to-schema prisma/schema.prisma --exit-code
   ```
   Hapus override dengan `Remove-Item Env:DATABASE_URL` jika sebelumnya kamu membuatnya untuk sesi ini. Smoke test hanya menerima nama DB berakhiran _test dan rollback seluruh fixture transaksi; dua seed upsert tidak menimpa perubahan kategori/setting. Database test tetap memiliki schema dan reference seed.
4. Setelah migration test, diff dan smoke lulus serta reviewer menyetujui, gunakan URL database `e_gudang` yang sudah diverifikasi kosong. Jalankan `npm run db:migrate`, `npm run db:seed`, `npm run db:status`. Jangan jalankan smoke pada database operasional.

Migration SQL awal disusun dari schema dengan CHECK tambahan; belum dihasilkan oleh Prisma CLI dalam environment implementor. CI menjalankan validate, generate, deploy pada MariaDB 11.4 kosong, schema diff untuk fitur yang didukung Prisma, seed dua kali dan adapter smoke. CHECK tidak sepenuhnya tercakup oleh diff Prisma, sehingga smoke menguji penolakan data invalid. Jangan menggunakan db push/reset untuk menutupi migration gagal. Migration yang sudah diterapkan tidak diedit; koreksi dengan migration baru.

## Acceptance Phase 3

- [ ] Prisma validate/generate, TypeScript, ESLint, unit tests, build lulus.
- [ ] Migration pada MariaDB CI dan versi Laragon target lulus, tidak ada drift schema yang didukung Prisma.
- [ ] Constraint dan rollback smoke lulus; timestamp UTC dan DATE benar.
- [ ] Seed idempotent; tanpa akun default atau stok dummy persisten.
- [ ] Review ERD, constraint, index, dan kontrak engine terhadap PRD.
- [ ] PR di-review sebelum merge. Auth, master CRUD dan inventory engine adalah fase berikutnya.
