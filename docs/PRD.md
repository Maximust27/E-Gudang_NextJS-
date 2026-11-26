# E-Gudang — Product Requirements Document (PRD)

| Atribut | Nilai |
| --- | --- |
| Produk | E-Gudang |
| Versi dokumen | 1.0 — Baseline V1 |
| Jenis | Warehouse Management System (WMS) internal |
| Bahasa antarmuka | Indonesia |
| Prinsip | Keep It Simple, professional, scan-first, library-first |
| Acuan desain | [DESIGN.md](./DESIGN.md) |
| Acuan kode | [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) |

> Dokumen ini merangkum scope hasil brainstorming. Keputusan teknis dan nilai default yang belum diuji merupakan baseline implementasi, bukan klaim bahwa aplikasi sudah dibangun.

## 1. Tujuan produk

Membantu admin dan operator mencatat, mencari, memantau, serta mengontrol barang gudang dengan cepat dan akurat. E-Gudang mengutamakan transaksi per karton, pemindaian barcode, pengelolaan batch, dan alokasi FIFO/FEFO otomatis.

### Prinsip pengembangan

- **KIS (Keep It Simple):** sedikit menu, alur singkat, tanpa fitur yang belum diperlukan.
- **Library-first:** gunakan komponen shadcn/ui dan library yang sesuai; jangan membangun ulang fungsi standar.
- **Design System First:** seluruh halaman wajib mengikuti [DESIGN.md](./DESIGN.md).
- **DRY & SSOT:** komponen, validasi, aturan stok, dan token desain memiliki sumber yang jelas; hindari duplikasi logika.
- **Data integrity first:** seluruh mutasi stok harus aman, konsisten, dan dapat ditelusuri.
- **Scalable without overengineering:** satu aplikasi full-stack Next.js; pemisahan tanggung jawab secukupnya.

## 2. Scope dan asumsi V1

- Satu gudang fisik dengan beberapa lokasi/rak; tidak ada transfer antar gudang.
- Unit transaksi dan saldo adalah karton utuh (CTN), bilangan bulat. Isi pcs per karton hanya informasi master, bukan unit transaksi V1.
- Setiap varian barang memiliki SKU unik dan barcode karton yang dapat dipindai.
- Stok dicatat per lot/batch penerimaan, termasuk barang FIFO. Tidak ada serial unik per karton.
- Scanner utama USB HID (keyboard wedge); input manual tersedia sebagai fallback. Kamera bukan syarat V1.
- Dua role: Admin dan Operator. Aplikasi internal menggunakan autentikasi, bukan akses publik.
- Database MariaDB/MySQL melalui Laragon. Aplikasi Next.js berjalan di Node.js.
- Zona waktu bisnis: Asia/Jakarta. Timestamp disimpan konsisten (disarankan UTC); tanggal kedaluwarsa adalah tanggal kalender lokal, bukan timestamp bergeser zona waktu.

### Di luar scope V1

Multi-warehouse, purchase order, sales order, akuntansi, approval bertingkat, serialisasi karton, transaksi pecahan karton, aplikasi mobile native, forecasting AI, integrasi marketplace, dan backend/microservices terpisah. Tidak ada kebutuhan untuk Redis, Redux, Docker, atau WebSocket pada baseline lokal.

## 3. Navigasi dan akses

Tujuh halaman utama; login adalah halaman sistem di luar sidebar. Notifikasi berada di header, bukan menu baru. Subfitur dapat berupa tab, dialog, sheet, atau halaman detail tanpa menambah menu utama.

| Menu | Route | Admin | Operator |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | Lihat | Lihat |
| Data Barang | `/data-barang` | Kelola | Lihat |
| Barang Masuk | `/barang-masuk` | Transaksi | Transaksi |
| Barang Keluar | `/barang-keluar` | Transaksi | Transaksi |
| Stok Opname | `/stok-opname` | Hitung dan konfirmasi | Hitung dan ajukan |
| Laporan | `/laporan` | Lihat dan ekspor | Lihat riwayat operasional |
| Pengaturan | `/pengaturan` | Kelola | Tidak diizinkan |

Admin juga berwenang atas import master, koreksi transaksi, penyesuaian barang rusak/expired, dan audit log. Operator dapat melihat riwayat dan hasil transaksi yang diperlukan untuk bekerja. Tidak ada approval admin untuk transaksi masuk/keluar normal. Semua izin divalidasi di server, bukan hanya melalui tampilan UI.

## 4. Kebutuhan fungsional per halaman

### 4.1 Dashboard

Empat KPI utama dengan unit yang jelas:

| KPI | Definisi |
| --- | --- |
| Total Stok | Jumlah karton yang layak dikeluarkan dari semua batch SKU aktif; stok fisik termasuk expired tersedia pada detail/laporan |
| Total SKU | Jumlah SKU aktif, termasuk SKU yang stoknya nol |
| Stok Menipis | Jumlah SKU aktif dengan stok tersedia > 0 dan <= minimum stok per SKU |
| Transaksi Hari Ini | Jumlah header transaksi IN dan OUT efektif yang diposting pada hari bisnis lokal (bukan jumlah baris atau karton) |

- Grafik batang **Barang Masuk vs Barang Keluar** dalam karton per hari; default 7 hari, filter 7/30 hari atau rentang tanggal. KPI tetap menunjukkan kondisi saat ini/hari ini.
- **Top 5 Fast Moving:** SKU dengan total karton keluar efektif tertinggi selama 30 hari terakhir. Istilah ini tidak selalu berarti penjualan/laris. Tampilkan nilai dan periode; urutan tie-break berdasarkan SKU.
- **Top 5 Dead Stock:** SKU dengan stok tersedia > 0 tanpa pengeluaran efektif selama minimal 60 hari. Hitung sejak tanggal yang lebih akhir antara pengeluaran terakhir dan penerimaan tertua dari lot tersedia saat ini; jika belum pernah keluar, gunakan penerimaan tertua yang masih tersedia. Barang baru tidak langsung dianggap dead stock. Urutkan hari tanpa pengeluaran terbanyak; tampilkan maksimal lima.
- Jika hasil ranking kurang dari lima, tampilkan data yang ada; jangan membuat data dummy pada aplikasi produksi.
- Panel perhatian: stok menipis, stok habis, batch mendekati expired, batch expired. Klik menuju daftar data yang sudah terfilter.
- Peringatan yang sama dapat diakses dari ikon lonceng pada header.
- Analytics hanya menggunakan transaksi efektif; draft, adjustment, dan reversal tidak dihitung sebagai aktivitas masuk/keluar normal. Transaksi yang sudah direversal dikecualikan dari agregasi operasional; ledger tetap menunjukkan keduanya.

### 4.2 Data Barang

- Daftar barang dengan pencarian nama, SKU, barcode; filter kategori, metode stok dan status; sorting dan pagination.
- Kolom utama: nama/SKU, kategori, stok tersedia (CTN), metode FIFO/FEFO, status, aksi. Barcode, lokasi, dan informasi lain dapat ditampilkan melalui detail.
- Master: SKU unik, nama, kategori, barcode karton unik, isi per karton (opsional, integer positif), minimum stok, metode pengeluaran efektif, status aktif/nonaktif. Foto/brand opsional, tidak menjadi blocker.
- Detail barang: ringkasan, stok per batch (jumlah fisik/tersedia, lokasi, expiry, tanggal diterima, status), riwayat stok.
- Tambah/edit master oleh Admin; gunakan nonaktif alih-alih menghapus master yang memiliki histori. Barang dengan saldo fisik tidak boleh dinonaktifkan sebelum diselesaikan.
- Import master dari Excel dengan template, validasi per baris, pratinjau, dan laporan error; duplikat tidak di-overwrite diam-diam. Tidak digunakan untuk menambah stok langsung.
- Cetak label barcode SKU/batch menggunakan template label yang konsisten.

### 4.3 Barang Masuk (Inbound)

- Daftar transaksi, pencarian nomor referensi, filter tanggal; tombol transaksi baru.
- Form: supplier, nomor surat jalan/referensi (opsional), tanggal penerimaan, catatan opsional.
- Scan barcode karton atau cari SKU; input jumlah karton, nomor batch pemasok (jika ada), expiry untuk FEFO, lokasi rak.
- Satu transaksi dapat memuat beberapa barang dan batch. Pemisahan expiry/lokasi harus menghasilkan lot berbeda.
- Sistem membuat kode lot internal unik per lot penerimaan. Label internal mengidentifikasi lot, tidak harus setiap karton memiliki serial berbeda.
- Validasi SKU aktif, jumlah positif, lokasi valid, expiry wajib untuk FEFO. Penerimaan barang yang sudah expired ditolak dalam alur normal.
- Konfirmasi menyimpan header, item, lot, dan ledger secara atomik. Stok bertambah setelah posting berhasil.
- Tampilkan ringkasan hasil serta opsi cetak label batch. Draft/form belum memengaruhi stok.

### 4.4 Barang Keluar (Outbound)

- Daftar transaksi dan filter seperti inbound. Form tujuan pengeluaran (teks sederhana), referensi/catatan opsional.
- Scan barcode SKU atau pilih barang; input jumlah karton.
- Sistem menghasilkan rekomendasi batch dan lokasi rak menurut FIFO/FEFO; dapat membagi permintaan ke beberapa batch.
- Operator mengambil barang sesuai rekomendasi dan memvalidasi lot fisik dengan scan kode lot internal atau input kode yang tepat. Barcode SKU saja tidak membuktikan batch yang diambil.
- Jika stok tidak cukup, batch tidak sesuai, atau sudah expired, transaksi ditolak. Tidak ada override FIFO/FEFO manual pada alur normal V1.
- Saat konfirmasi, server menghitung ulang alokasi di dalam transaksi database. Bila rekomendasi berubah sejak preview, minta operator memeriksa ulang dan konfirmasi ulang; jangan mengganti lot fisik secara diam-diam.
- Posting mengurangi stok lot dan mencatat seluruh alokasi dalam ledger. Tidak ada pengurangan stok pada scan atau preview saja.

### 4.5 Stok Opname

- Buat sesi hitung untuk barang/lot yang dipilih. Tidak wajib menghitung seluruh gudang sekaligus.
- Scan barang/lot, masukkan jumlah fisik karton per lot termasuk nilai 0; tampilkan stok sistem dan selisih.
- Alasan wajib jika ada selisih; catatan opsional jika sesuai.
- Operator mengajukan hasil, Admin memeriksa lalu konfirmasi sekali. Tidak ada approval bertingkat.
- Ketika konfirmasi, server mengunci lot dan memvalidasi versi/snapshot saldo. Jika terdapat mutasi setelah pencatatan hitungan, batalkan konfirmasi bagian terkait sampai hitungan diperbarui.
- Buat transaksi ADJUSTMENT dan ledger bila terdapat selisih; jika semua sesuai, tutup sesi tanpa mutasi. Sesi yang sama tidak boleh diposting dua kali.
- Lot fisik yang belum terdaftar tidak dapat ditambahkan sebagai saldo tanpa metadata dan otorisasi Admin; harus direkonsiliasi dahulu dengan batch/expiry yang benar.
- Barang rusak/expired yang dikeluarkan dari gudang dicatat melalui adjustment dengan alasan. Expired tidak layak dikeluarkan secara normal, tetapi tetap dihitung fisik sampai benar-benar dikeluarkan. V1 tidak memiliki workflow karantina terpisah.

### 4.6 Laporan

Cukup tiga tab: **Riwayat Transaksi**, **Kartu Stok**, **Ringkasan Inventaris**.

- Riwayat: nomor transaksi, tipe, tanggal, operator, jumlah, status efektif, referensi; detail batch dan reversal.
- Kartu stok: SKU/lot, waktu, jenis mutasi, saldo sebelum, perubahan (+/- CTN), saldo setelah, transaksi sumber, operator.
- Ringkasan inventaris: stok fisik/tersedia per SKU, status stok, expiry, dan lokasi batch.
- Filter tanggal/SKU/tipe sesuai tab. Export Excel mengikuti filter dan otorisasi, bukan hanya halaman pagination yang sedang terlihat.
- Admin dapat membuat reversal melalui detail transaksi dengan alasan wajib. Transaksi original tetap tersimpan.
- Reversal IN hanya jika saldo lot asli mencukupi dan tidak menyebabkan ketidakkonsistenan; reversal OUT mengembalikan ke lot asli. Lot expired tetap tidak layak dikeluarkan. Jika koreksi tidak bisa dilakukan aman, arahkan ke stok opname/adjustment yang sah.
- Satu transaksi asli hanya dapat direversal sekali. Reversal tidak menghapus atau mengedit ledger lama.

### 4.7 Pengaturan

Gunakan tab sederhana: **Kategori**, **Supplier**, **Lokasi Rak**, **Pengguna**, **Umum** (serta akses audit log untuk Admin).

- Kategori memiliki metode default. Makanan dan minuman = FEFO; barang umum tanpa expiry = FIFO. Barang lain yang memiliki expiry juga wajib FEFO.
- Admin boleh mengatur metode per SKU selama tidak melanggar kebutuhan expiry. Perubahan metode yang membuat lot lama tidak valid harus ditolak sampai data diperbaiki.
- Supplier dan lokasi rak memiliki nama/kode serta status aktif. Referensi historis tidak dihapus.
- User: Admin/Operator, aktif/nonaktif, pengaturan ulang kata sandi oleh Admin. Tidak ada pendaftaran publik.
- Umum: ambang near-expiry (default 30 hari) dan dead stock (default 60 hari). Minimum stok diatur per SKU.
- Audit log sederhana: siapa, kapan, aksi, entitas/referensi, perubahan yang relevan. Jangan menyimpan password, token, atau rahasia.
- Backup database rutin merupakan prosedur operasional Admin; tidak perlu halaman backup khusus.

## 5. Aturan inventory engine

### 5.1 FIFO dan FEFO

| Metode | Urutan lot yang memenuhi syarat |
| --- | --- |
| FIFO | `received_at ASC`, lalu `id ASC` |
| FEFO | `expiry_date ASC`, lalu `received_at ASC`, lalu `id ASC` |

Syarat lot: SKU aktif, saldo > 0, expiry belum lewat sesuai kebijakan lokal, serta metadata yang dibutuhkan valid. Semua lot dengan expiry harus mengikuti FEFO. Lot yang diblokir tidak ikut dalam alokasi otomatis.

Contoh FEFO: lot A (20 Des, 50 CTN), B (5 Des, 20 CTN), C (15 Des, 30 CTN). Permintaan 35 CTN menggunakan B 20 + C 15, selama belum expired. Jika hanya 30 CTN tersedia, permintaan 35 ditolak seluruhnya.

**Kebijakan awal expiry:** tanggal expiry <= tanggal lokal hari ini dianggap tidak layak keluar (konservatif). Near-expiry: 1 sampai N hari menuju expiry; hanya lot bersaldo. Kebijakan tanggal ini perlu dikonfirmasi dengan aturan produk/gudang sebelum go-live. Jangan mengubah aturan expiry secara diam-diam.

### 5.2 Barcode scan-first

- Barcode SKU karton mengenali jenis barang; barcode lot internal mengenali penerimaan/batch/lokasi. Simpan barcode sebagai string agar nol di depan tidak hilang.
- Gunakan kode internal dengan namespace/prefix yang tidak bertabrakan dengan barcode SKU dan validasi keunikan.
- Scanner USB HID dibaca melalui field fokus + terminator (biasanya Enter, dapat disesuaikan perangkat). Satu scan SKU menambah 1 CTN; operator juga dapat memasukkan jumlah bulk.
- Scan lot pada outbound memvalidasi lot dan jumlah yang diambil; satu scan dapat mewakili satu karton atau konfirmasi jumlah bulk yang jelas pada UI.
- Berikan umpan balik visual dan bunyi opsional, tampilkan hasil scan terbaru, dan pertahankan fokus dengan aman. Scan yang tidak dikenal tidak menambah stok.
- Scan barcode SKU yang sama berkali-kali adalah valid; jangan melakukan deduplikasi scan produk secara agresif. Yang harus dicegah adalah posting transaksi yang sama dua kali.

### 5.3 Integritas dan concurrency

- `inventory_batches.qty_on_hand` menyimpan saldo operasional per lot; `stock_movements` merupakan ledger mutasi immutable. Saldo lot adalah proyeksi ledger yang diperbarui secara atomik; `products` tidak memiliki kolom saldo total independen.
- Total fisik = jumlah saldo lot; total tersedia = jumlah saldo lot yang eligible. Barang expired tetap fisik sampai adjustment/reversal yang sah.
- Gunakan InnoDB, foreign key, unique constraint, indeks, validasi bilangan bulat, dan constraint saldo nonnegatif bila didukung versi DB yang dipilih.
- Satu operasi posting/reversal/adjustment memakai satu Prisma interactive transaction. Semua jalur penulis stok mengikuti protokol lock yang sama: kunci produk terkait secara berurutan (ID ascending) dan lot yang akan diubah; baca ulang data setelah lock, lalu validasi sebelum update. Gunakan query locking terparameterisasi bila diperlukan, misalnya `SELECT ... FOR UPDATE` pada koneksi transaksi yang sama.
- Saat alokasi lintas batch tidak mencukupi, rollback semuanya. Tidak boleh ada transaksi setengah tersimpan.
- Posting memiliki idempotency key unik; retry dengan payload yang sama mengembalikan hasil terdahulu, key sama dengan payload berbeda ditolak. Tombol submit juga dicegah double-click di UI.
- Simpan saldo sebelum/sesudah dan referensi pada setiap stock movement. Jangan hard delete transaksi yang sudah diposting.
- Transaksi draft tidak memengaruhi stok. Status efektif transaksi yang direversal dapat diturunkan dari relasi reversal.
- Uji concurrency dan rollback pada MariaDB yang benar-benar dipakai, bukan hanya mock/SQLite.

## 6. Model data konseptual

Nama tabel berikut adalah acuan, bukan migration yang sudah dibuat. Gunakan Prisma model PascalCase dan `@@map` / `@map` bila memakai nama tabel/kolom snake_case.

| Tabel | Data utama |
| --- | --- |
| `users` | id, email unik, password hash, nama, role, status |
| `categories` | id, nama, metode default, status |
| `products` | id, sku unik, carton_barcode unik, nama, category_id, metode override opsional, isi karton, min_stock, status |
| `suppliers` | id, nama, kode opsional, status |
| `locations` | id, kode rak unik, nama, status |
| `inventory_batches` | id, product_id, location_id, internal_lot_code unik, supplier_batch_no, received_at, expiry_date nullable, qty_on_hand, version, receipt_item_id |
| `transactions` | id, nomor unik, type (IN/OUT/ADJUSTMENT/REVERSAL), status, supplier_id nullable, destination, reference, posted_at, user_id, idempotency_key, reversal_of_id unik nullable, opname_id unik nullable, reason |
| `transaction_items` | id, transaction_id, product_id, quantity CTN, snapshot isi karton bila relevan |
| `stock_movements` | id, transaction_item_id, batch_id, signed_delta, qty_before, qty_after, created_at; alokasi batch dan ledger dalam satu tabel |
| `stock_opnames` | id, nomor, status, created_by, approved_by, timestamps |
| `stock_opname_items` | id, opname_id, batch_id, snapshot_qty/version, counted_qty, reason |
| `activity_logs` | id, user_id, action, entity_type/id, metadata, created_at |
| `settings` | key unik, value; ambang global sederhana |

Relasi penting: satu product memiliki banyak batch; satu transaksi memiliki banyak item; satu item dapat menghasilkan banyak movement untuk batch berbeda. Inbound item dapat menghasilkan lot penerimaan; outbound item dapat mengalokasikan beberapa lot melalui movement. Tidak perlu tabel alokasi tambahan dengan data yang sama pada V1. Gunakan indeks sesuai query alokasi (product, expiry, received_at), ledger (batch, waktu), transaksi (type, posted_at), dan filter aktif.

## 7. Technology stack

| Kebutuhan | Pilihan |
| --- | --- |
| Full-stack & bahasa | Next.js App Router, TypeScript |
| Styling & UI | Tailwind CSS, shadcn/ui, Lucide React, Geist (`next/font`) |
| Theme | `next-themes` |
| ORM & database | Prisma, MariaDB/MySQL melalui Laragon; provider `mysql` |
| Authentication | Auth.js, credentials internal, password hash yang aman |
| Form & validation | React Hook Form, Zod (validasi server wajib) |
| Tabel | TanStack Table + shadcn/ui |
| Chart | Recharts melalui shadcn/ui Chart |
| Notifikasi UI | Sonner |
| Tanggal | date-fns; util zona waktu terpusat, tambahkan adapter hanya jika diperlukan |
| Barcode | Native keyboard events/input + JsBarcode (generate Code 128/format relevan) |
| Excel | ExcelJS |
| Testing | Vitest untuk unit/integration; Playwright untuk alur penting jika diperlukan |

Pakai versi yang kompatibel dan stabil pada saat setup; lockfile wajib dikomit. Jangan memasang library lain yang mengulang kemampuan yang sudah tersedia. Prisma adapter/config, Auth.js, dan versi Node.js mengikuti versi terpilih, bukan asumsi tentang versi terbaru.

## 8. Kebutuhan nonfungsional

- **UI/UX:** konsisten mengikuti DESIGN.md; responsive, light/dark, keyboard-friendly, target WCAG 2.2 AA.
- **Kecepatan:** scan tidak menunggu reload halaman penuh; tabel besar dipaginasi di server, pencarian/filter di-query dengan indeks yang sesuai. KPI menggunakan agregasi database, bukan mengambil seluruh histori ke browser.
- **Keamanan:** semua route dan mutasi sensitif membutuhkan autentikasi/otorisasi server. Validasi Zod, query terparameterisasi, hash password aman (Argon2id atau bcrypt dengan konfigurasi yang layak), rahasia hanya di environment server, session aman dan rate limiting login. Role/status user diperiksa ulang di server untuk operasi sensitif.
- **Reliability:** error handling jelas; kegagalan posting tidak mengubah stok sebagian. Audit log tidak menggantikan ledger stok.
- **Operasional:** backup MariaDB terjadwal ke lokasi aman yang terpisah dari folder DB; uji restore secara berkala. Laragon dipakai untuk development lokal, bukan otomatis dianggap deployment produksi yang aman.

## 9. Urutan development

| Fase | Deliverable / exit criteria |
| --- | --- |
| 1. Foundation | Next.js + TypeScript, shadcn/ui, token global, layout, DB Prisma/Laragon, auth dan role |
| 2. Master data | Produk, kategori, supplier, rak, barcode, validasi dan pencarian |
| 3. Inventory core | Inbound/outbound, FIFO/FEFO, lot validation, scanning, ledger, transaksi atomik |
| 4. Inventory control | Opname, adjustment, reversal, audit |
| 5. Dashboard & laporan | KPI, grafik, ranking, alerts, kartu stok, Excel import/export |
| 6. QA & release | Test DB/concurrency/scanner, UX responsive/theme, backup/restore, dokumentasi |

Buat design system pada fase 1 sebelum halaman bisnis. Dashboard dapat memakai placeholder saat membangun layout, tetapi produksi hanya memakai data nyata setelah inventory engine siap.

## 10. Acceptance criteria V1

- [ ] Admin dan Operator hanya dapat melakukan tindakan sesuai izin, termasuk saat memanggil server langsung.
- [ ] SKU/barcode unik; nol di depan tetap utuh; jumlah karton selalu valid.
- [ ] Inbound multi-item/batch menyimpan saldo dan ledger yang sesuai.
- [ ] FIFO memilih penerimaan tertua; FEFO memilih expiry terdekat; tie-break deterministik.
- [ ] Outbound lintas batch berhasil jika cukup, gagal tanpa mutasi jika tidak cukup.
- [ ] Batch salah, expired, atau berubah sejak rekomendasi tidak terposting diam-diam.
- [ ] Dua operator yang mengeluarkan stok bersamaan tidak dapat menghasilkan saldo negatif.
- [ ] Retry/double submit tidak menciptakan transaksi atau ledger ganda.
- [ ] Opname per lot, termasuk 0 CTN, mencatat adjustment dengan alasan; snapshot usang ditolak.
- [ ] Reversal aman dan dapat ditelusuri, tidak menghapus histori, tidak menggandakan pengembalian.
- [ ] KPI, chart, ranking, dan alerts sesuai ledger/saldo serta definisi periode.
- [ ] Excel import menolak data invalid/duplikat; export mengikuti filter.
- [ ] Semua tujuh halaman mengikuti token, typography, spacing, dan komponen global; berfungsi di light/dark dan layar mobile.
- [ ] Scanner USB nyata, input manual, label cetak, dan backup/restore diuji.

## 11. Keputusan baseline yang perlu diverifikasi sebelum go-live

Satu gudang, dua role, transaksi CTN utuh, barcode internal level lot, lokasi per lot, tanggal expiry konservatif, dead stock 60 hari, near-expiry 30 hari, dan batas ekspor Operator merupakan pilihan V1 untuk menjaga kesederhanaan. Kebijakan expiry, format label, karakter/terminator scanner, versi dependency dan engine DB, batas akses laporan, serta kebutuhan deployment produksi perlu dikonfirmasi melalui pengujian operasional. Jika scope berubah, revisi PRD dan DESIGN sebelum implementasi fitur baru.
