# RDP — Restaurant / POS System
## Rancangan Desain Perangkat Lunak

| Item | Keterangan |
|------|------------|
| **Nama Proyek** | Restaurant / POS System |
| **Versi Dokumen** | 1.1 |
| **Tanggal** | 8 Juni 2026 |
| **Status** | Draft v1.1 — Review Stakeholder |
| **Referensi** | Workflow Diagram — Restaurant / POS System Workflow |

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Ruang Lingkup Sistem](#2-ruang-lingkup-sistem)
3. [Stakeholder & Peran Pengguna](#3-stakeholder--peran-pengguna)
4. [Alur Bisnis (Business Process)](#4-alur-bisnis-business-process)
5. [Kebutuhan Fungsional](#5-kebutuhan-fungsional)
6. [Kebutuhan Non-Fungsional](#6-kebutuhan-non-fungsional)
7. [Arsitektur Sistem](#7-arsitektur-sistem)
8. [Desain Database](#8-desain-database)
9. [Desain Modul & API](#9-desain-modul--api)
10. [Desain Antarmuka (UI/UX)](#10-desain-antarmuka-uiux)
11. [Integrasi Eksternal](#11-integrasi-eksternal)
12. [Keamanan & Hak Akses](#12-keamanan--hak-akses)
13. [Aturan Bisnis (Business Rules)](#13-aturan-bisnis-business-rules)
14. [Strategi Pengujian](#14-strategi-pengujian)
15. [Deployment & Operasional](#15-deployment--operasional)
16. [Rencana Pengembangan (Milestone)](#16-rencana-pengembangan-milestone)
17. [Glosarium](#17-glosarium)
18. [Lampiran](#18-lampiran)

---

## 1. Pendahuluan

### 1.1 Latar Belakang

Restoran dan kafe membutuhkan sistem Point of Sale (POS) terintegrasi yang mampu mengelola seluruh siklus operasional — mulai dari penerimaan pesanan pelanggan, persiapan di dapur, pembayaran, pengelolaan stok bahan baku, hingga pelaporan analitik bisnis.

Dokumen ini merupakan **Rancangan Desain Perangkat Lunak (RDP)** yang mendefinisikan kebutuhan, arsitektur, dan spesifikasi teknis sistem POS berdasarkan workflow yang telah ditetapkan.

### 1.2 Tujuan Sistem

| No | Tujuan |
|----|--------|
| 1 | Mempercepat proses pemesanan dan pembayaran di front-of-house |
| 2 | Menyinkronkan pesanan secara real-time ke dapur melalui Kitchen Display System (KDS) |
| 3 | Mendukung multi-metode pembayaran (tunai, kartu, dompet digital) |
| 4 | Mengelola stok bahan baku secara otomatis berdasarkan resep |
| 5 | Menyediakan laporan penjualan dan analitik bisnis real-time |
| 6 | Meningkatkan akurasi data transaksi dan mengurangi human error |

### 1.3 Definisi Singkat

- **POS** — Point of Sale; sistem kasir dan manajemen transaksi penjualan.
- **KDS** — Kitchen Display System; layar digital di dapur untuk menampilkan pesanan.
- **Front-of-House (FOH)** — Area pelayanan pelanggan (kasir, meja, waiter).
- **Back-of-House (BOH)** — Area operasional belakang (dapur, gudang, inventory).
- **BOM** — Bill of Materials; daftar bahan baku per menu (resep).

---

## 2. Ruang Lingkup Sistem

### 2.1 Dalam Ruang Lingkup (In Scope)

| Modul | Deskripsi |
|-------|-----------|
| Order Management | Pembuatan, edit, konfirmasi, dan pengiriman pesanan |
| Table Management | Manajemen meja (dine-in) dan mode takeaway |
| Menu Management | Kategori menu, item, harga, modifier, ketersediaan |
| Kitchen Display System (KDS) | Tampilan pesanan dapur, status persiapan |
| Payment Processing | Tagihan, multi-metode bayar, struk |
| Inventory Management | Stok bahan, auto-deduct, alert, restock |
| Reporting & Analytics | Laporan harian, kategori, performa staff |
| User & Role Management | Autentikasi, otorisasi per peran |
| Receipt Management | Cetak fisik & e-receipt |

### 2.2 Di Luar Ruang Lingkup (Out of Scope) — Fase 1

| Item | Keterangan |
|------|------------|
| Aplikasi mobile pelanggan (self-order) | Dapat ditambahkan di fase berikutnya |
| Integrasi akuntansi penuh (ERP) | Hanya export data dasar |
| Loyalty program / membership | Fase 3 |
| Reservasi meja online | Fase 3 |
| Multi-cabang / franchise | Fase 3 |
| Delivery aggregator (GoFood, GrabFood) | Fase 3 |

### 2.3 Asumsi & Ketergantungan

- Outlet memiliki koneksi internet stabil (dengan mode offline fallback).
- Perangkat kasir: **aplikasi mobile Android/iOS** (atau tablet) dengan printer thermal (opsional).
- Dashboard manajemen diakses via web browser (PC/laptop).
- Dapur memiliki layar terpisah untuk KDS.
- Data menu dan resep (BOM) sudah disiapkan oleh manajemen outlet.
- Pembayaran kartu memerlukan terminal POS pihak ketiga (jika digunakan).

---

## 3. Stakeholder & Peran Pengguna

### 3.1 Stakeholder

| Stakeholder | Peran | Kepentingan |
|-------------|-------|-------------|
| Owner / Pemilik | Pengambil keputusan bisnis | Laporan revenue, profit, performa outlet |
| Manager | Operasional harian | Monitoring stok, staff, penjualan |
| Kasir / Cashier | Front-of-house | Proses order & pembayaran cepat |
| Waiter / Server | Pelayanan meja | Input order, update status meja |
| Kitchen Staff | Dapur | Melihat & menyelesaikan pesanan via KDS |
| Inventory Staff | Gudang | Restock, update stok, terima alert |
| System Admin | IT / setup | Konfigurasi sistem, user, backup |

### 3.2 Matriks Peran & Hak Akses

| Fitur | Admin | Manager | Cashier | Waiter | Kitchen | Inventory |
|-------|:-----:|:-------:|:-------:|:------:|:-------:|:---------:|
| Dashboard & Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kelola Menu | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kelola User | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Buat / Edit Order | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Proses Pembayaran | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| KDS — Update Status | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Kelola Inventory | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Void / Refund | ✅ | ✅ | ⚠️* | ❌ | ❌ | ❌ |
| Export Laporan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> ⚠️* Void/refund oleh Cashier memerlukan approval Manager (opsional, configurable).
>
> **Keterangan Versi 1.1:** Peran Kasir dan Waiter mengoperasikan **Mobile Application** (Android/iOS). Peran Admin, Manager, Inventory, dan Kitchen mengoperasikan **Dashboard Web**. Rincian pembagian fungsi tercantum pada Lampiran F.

### 3.3 Persona Pengguna

**Persona 1 — Rina (Cashier)**
- Usia 24, pengguna aktif smartphone
- Butuh: input order cepat, hitung kembalian otomatis, cetak struk
- Pain point: antrian panjang saat peak hour

**Persona 2 — Budi (Kitchen Staff)**
- Usia 30, fokus ke kecepatan dapur
- Butuh: daftar pesanan jelas, urutan prioritas, notifikasi order baru
- Pain point: kertas order hilang/rusak

**Persona 3 — Andi (Manager)**
- Usia 35, butuh gambaran bisnis harian
- Butuh: laporan penjualan, stok menipis, performa shift
- Pain point: data manual tidak akurat

---

## 4. Alur Bisnis (Business Process)

Berdasarkan workflow diagram, sistem terdiri dari **5 alur utama** yang saling berinteraksi.

### 4.1 Order Flow (Alur Pemesanan)

```
Customer Arrives
    → Select Table / Takeaway
    → Browse Menu
    → Add Items to Order
    → Review & Confirm Order
    → Send to Kitchen
```

| Step | Aktor | Input | Output | Sistem |
|------|-------|-------|--------|--------|
| Customer Arrives | Waiter/Cashier | — | Sesi order baru | Buat record order draft |
| Select Table/Takeaway | Waiter/Cashier | Nomor meja / tipe order | Order terikat meja atau takeaway | Update `orders.order_type`, `table_id` |
| Browse Menu | Waiter/Cashier | — | Daftar menu tampil | Query menu aktif per kategori |
| Add Items | Waiter/Cashier | Item, qty, modifier, notes | Line items order | Insert `order_items` |
| Review & Confirm | Waiter/Cashier | Konfirmasi | Order status = `confirmed` | Validasi stok & harga |
| Send to Kitchen | Sistem (auto) | Order confirmed | Ticket di KDS | Trigger KDS + inventory deduct |

### 4.2 Kitchen Flow (Alur Dapur)

```
Kitchen Display (KDS)
    → Prepare Items
    → Mark Ready
    → Serve / Notify Customer
```

| Step | Aktor | Input | Output | Sistem |
|------|-------|-------|--------|--------|
| KDS Display | Kitchen Staff | — | Daftar order masuk | Real-time push/WebSocket |
| Prepare Items | Kitchen Staff | — | Status = `preparing` | Update `order_items.status` |
| Mark Ready | Kitchen Staff | Tap "Ready" | Status = `ready` | Notifikasi ke waiter/kasir |
| Serve/Notify | Waiter | — | Status = `served` | Update order, bebaskan meja (jika perlu) |

### 4.3 Payment Flow (Alur Pembayaran)

```
Request Bill
    → Generate Receipt / Invoice
    → Select Payment Method
        ├── Cash
        ├── Card (POS Terminal)
        └── Digital Wallet
    → Payment Confirmed
    → Print / Send E-Receipt
```

| Step | Aktor | Input | Output | Sistem |
|------|-------|-------|--------|--------|
| Request Bill | Cashier | Order ID | Ringkasan tagihan | Kalkulasi subtotal, tax, service, diskon |
| Generate Receipt | Sistem | Order data | Invoice number | Generate `receipts` record |
| Select Payment | Cashier | Metode + nominal | Payment record | Insert `payments` |
| Payment Confirmed | Sistem | Pembayaran valid | Order status = `paid` | Update order, trigger report log |
| Print/E-Receipt | Cashier/Sistem | — | Struk fisik/digital | Cetak thermal / kirim email/WA |

### 4.4 Inventory Flow (Alur Inventori)

```
Auto-Deduct Ingredients
    → Check Stock Levels
    → Low Stock Alert
    → Restock / Supplier Order
    → Update Inventory
```

| Step | Trigger | Input | Output | Sistem |
|------|---------|-------|--------|--------|
| Auto-Deduct | Order confirmed | BOM per menu item | Stok berkurang | Kurangi `ingredient_stocks` |
| Check Stock | Setelah deduct | — | Level stok terkini | Query & bandingkan threshold |
| Low Stock Alert | Stok < minimum | — | Notifikasi alert | Push notif ke inventory staff |
| Restock | Inventory staff | Qty masuk, supplier | Purchase order | Insert `stock_movements` |
| Update Inventory | Restock selesai | — | Stok terbaru | Update `ingredient_stocks` |

### 4.5 Reports & Analytics Flow (Alur Laporan)

```
Log All Transactions
    → Daily Sales Summary
    → Revenue by Category
    → Staff Performance
    → Export / Dashboard View
```

| Step | Trigger | Data | Output |
|------|---------|------|--------|
| Log Transactions | Payment confirmed | Order, payment, items | Record di `transaction_logs` |
| Daily Summary | End of day / on-demand | Aggregasi transaksi | Total sales, orders, avg ticket |
| Revenue by Category | On-demand | Per kategori menu | Breakdown pendapatan |
| Staff Performance | On-demand | Per user/shift | Jumlah order, revenue, waktu rata-rata |
| Export/Dashboard | Manager request | Filtered data | PDF, Excel, chart dashboard |

### 4.6 Diagram Interaksi Antar Modul

```
┌─────────────┐     confirm      ┌─────────────┐
│ ORDER FLOW  │ ───────────────► │ KITCHEN FLOW│
└──────┬──────┘                  └──────┬──────┘
       │                                │
       │ auto-deduct                    │ served
       ▼                                ▼
┌─────────────┐                  ┌─────────────┐
│ INVENTORY   │                  │ PAYMENT FLOW│
│ FLOW        │                  └──────┬──────┘
└─────────────┘                         │
                                        │ log transaction
                                        ▼
                                 ┌─────────────┐
                                 │ REPORTS &   │
                                 │ ANALYTICS   │
                                 └─────────────┘
```

---

## 5. Kebutuhan Fungsional

Setiap kebutuhan diberi ID unik untuk tracking implementasi dan testing.

### 5.1 Modul Order Management

| ID | Kebutuhan | Prioritas | Keterangan |
|----|-----------|:---------:|------------|
| FR-ORD-001 | Sistem dapat membuat order baru (draft) | Must | Auto-generate order number |
| FR-ORD-002 | Sistem dapat memilih tipe order: dine-in atau takeaway | Must | Default: dine-in |
| FR-ORD-003 | Sistem dapat mengaitkan order dengan meja | Must | Hanya untuk dine-in |
| FR-ORD-004 | Sistem dapat menampilkan menu per kategori | Must | Filter: aktif, tersedia |
| FR-ORD-005 | Sistem dapat menambah item ke order dengan qty | Must | Min qty: 1 |
| FR-ORD-006 | Sistem dapat menambah modifier/opsi item | Should | Contoh: level pedas, ukuran |
| FR-ORD-007 | Sistem dapat menambah catatan khusus per item | Should | Contoh: "tanpa bawang" |
| FR-ORD-008 | Sistem dapat mengedit order sebelum confirm | Must | — |
| FR-ORD-009 | Sistem dapat menghapus item dari order draft | Must | — |
| FR-ORD-010 | Sistem dapat mengkonfirmasi order | Must | Status: draft → confirmed |
| FR-ORD-011 | Sistem otomatis kirim order ke KDS setelah confirm | Must | Real-time |
| FR-ORD-012 | Sistem dapat membatalkan order (void) | Must | Perlu alasan + otorisasi |
| FR-ORD-013 | Sistem dapat split bill (pisah tagihan) | Could | Fase 2 |
| FR-ORD-014 | Sistem dapat hold/simpan order sementara | Should | Untuk meja yang belum selesai |

### 5.2 Modul Table Management

| ID | Kebutuhan | Prioritas | Keterangan |
|----|-----------|:---------:|------------|
| FR-TBL-001 | Sistem dapat menampilkan denah/status meja | Must | Status: available, occupied, reserved |
| FR-TBL-002 | Sistem dapat mengubah status meja otomatis saat order aktif | Must | occupied saat order confirmed |
| FR-TBL-003 | Sistem dapat membebaskan meja setelah pembayaran | Must | Status → available |
| FR-TBL-004 | Sistem dapat menggabungkan meja (merge table) | Could | Fase 2 |
| FR-TBL-005 | Admin dapat CRUD data meja | Must | Nomor, kapasitas, area |

### 5.3 Modul Menu Management

| ID | Kebutuhan | Prioritas | Keterangan |
|----|-----------|:---------:|------------|
| FR-MNU-001 | Admin dapat CRUD kategori menu | Must | Contoh: Makanan, Minuman, Dessert |
| FR-MNU-002 | Admin dapat CRUD item menu | Must | Nama, harga, kategori, gambar |
| FR-MNU-003 | Admin dapat set ketersediaan item (available/sold out) | Must | Real-time ke order screen |
| FR-MNU-004 | Admin dapat mengelola modifier/opsi per item | Should | Harga tambahan opsional |
| FR-MNU-005 | Admin dapat mengaitkan resep (BOM) ke menu item | Must | Untuk auto-deduct inventory |
| FR-MNU-006 | Sistem mendukung harga berbeda per tipe order | Could | Dine-in vs takeaway |
| FR-MNU-007 | Sistem dapat set jam operasional menu | Could | Breakfast menu, dll. |

### 5.4 Modul Kitchen Display System (KDS)

| ID | Kebutuhan | Prioritas | Keterangan |
|----|-----------|:---------:|------------|
| FR-KDS-001 | KDS menampilkan order baru secara real-time | Must | WebSocket / SSE |
| FR-KDS-002 | KDS menampilkan detail item, qty, modifier, notes | Must | — |
| FR-KDS-003 | KDS menampilkan nomor meja / tipe order | Must | — |
| FR-KDS-004 | Kitchen staff dapat update status: preparing | Must | Per item atau per order |
| FR-KDS-005 | Kitchen staff dapat update status: ready | Must | Trigger notifikasi |
| FR-KDS-006 | KDS menampilkan waktu elapsed sejak order masuk | Should | Timer countdown |
| FR-KDS-007 | KDS dapat filter per station (bar, grill, pastry) | Should | Berdasarkan kategori item |
| FR-KDS-008 | KDS dapat menandai order prioritas/rush | Could | Fase 2 |
| FR-KDS-009 | Suara notifikasi saat order baru masuk | Should | Configurable on/off |

### 5.5 Modul Payment

| ID | Kebutuhan | Prioritas | Keterangan |
|----|-----------|:---------:|------------|
| FR-PAY-001 | Sistem dapat generate tagihan dari order | Must | Subtotal + tax + service charge |
| FR-PAY-002 | Sistem mendukung pembayaran tunai | Must | Hitung kembalian otomatis |
| FR-PAY-003 | Sistem mendukung pembayaran kartu | Must | Via terminal POS |
| FR-PAY-004 | Sistem mendukung dompet digital | Should | QRIS, OVO, GoPay, dll. |
| FR-PAY-005 | Sistem mendukung split payment (multi-metode) | Could | Fase 2 |
| FR-PAY-006 | Sistem dapat menerapkan diskon (nominal/persen) | Should | Perlu otorisasi manager |
| FR-PAY-007 | Sistem generate nomor invoice unik | Must | Format configurable |
| FR-PAY-008 | Sistem dapat mencetak struk thermal | Must | Template configurable |
| FR-PAY-009 | Sistem dapat mengirim e-receipt (email) | Should | — |
| FR-PAY-010 | Sistem dapat memproses refund | Must | Partial/full, perlu otorisasi |
| FR-PAY-011 | Sistem mencatat semua transaksi pembayaran | Must | Audit trail |

### 5.6 Modul Inventory

| ID | Kebutuhan | Prioritas | Keterangan |
|----|-----------|:---------:|------------|
| FR-INV-001 | Admin dapat CRUD data bahan baku (ingredients) | Must | Nama, satuan, stok min |
| FR-INV-002 | Sistem auto-deduct bahan saat order confirmed | Must | Berdasarkan BOM/resep |
| FR-INV-003 | Sistem menampilkan level stok real-time | Must | — |
| FR-INV-004 | Sistem mengirim alert saat stok di bawah minimum | Must | In-app + opsional email |
| FR-INV-005 | Inventory staff dapat input restock | Must | Qty, supplier, tanggal |
| FR-INV-006 | Sistem mencatat riwayat pergerakan stok | Must | In/out/adjustment |
| FR-INV-007 | Admin dapat mengelola data supplier | Should | Nama, kontak, lead time |
| FR-INV-008 | Sistem dapat membuat purchase order ke supplier | Could | Fase 2 |
| FR-INV-009 | Sistem dapat stock opname (penghitungan fisik) | Should | Adjustment manual |

### 5.7 Modul Reports & Analytics

| ID | Kebutuhan | Prioritas | Keterangan |
|----|-----------|:---------:|------------|
| FR-RPT-001 | Sistem mencatat log setiap transaksi | Must | Immutable audit log |
| FR-RPT-002 | Dashboard menampilkan ringkasan penjualan harian | Must | Total sales, order count, avg ticket |
| FR-RPT-003 | Laporan pendapatan per kategori menu | Must | Filter: hari/minggu/bulan |
| FR-RPT-004 | Laporan performa staff | Should | Order handled, revenue generated |
| FR-RPT-005 | Laporan item terlaris (best seller) | Should | Top N items |
| FR-RPT-006 | Laporan metode pembayaran | Should | Breakdown cash/card/digital |
| FR-RPT-007 | Export laporan ke PDF | Must | — |
| FR-RPT-008 | Export laporan ke Excel/CSV | Should | — |
| FR-RPT-009 | Dashboard grafik trend penjualan | Should | Line/bar chart |
| FR-RPT-010 | Laporan penggunaan bahan baku | Could | Fase 2 |

### 5.8 Modul User & Autentikasi

| ID | Kebutuhan | Prioritas | Keterangan |
|----|-----------|:---------:|------------|
| FR-AUTH-001 | Sistem mendukung login dengan username/password | Must | — |
| FR-AUTH-002 | Sistem mendukung login PIN cepat (kasir/kitchen) | Should | 4-6 digit |
| FR-AUTH-003 | Sistem menerapkan role-based access control | Must | Lihat matriks §3.2 |
| FR-AUTH-004 | Sistem mencatat aktivitas login/logout | Must | Audit trail |
| FR-AUTH-005 | Admin dapat CRUD user | Must | — |
| FR-AUTH-006 | Sistem mendukung shift management (buka/tutup kas) | Should | Cash drawer tracking |

---

## 6. Kebutuhan Non-Fungsional

### 6.1 Performa

| ID | Kebutuhan | Target |
|----|-----------|--------|
| NFR-PERF-001 | Response time halaman utama | < 2 detik |
| NFR-PERF-002 | Response time API CRUD | < 500 ms |
| NFR-PERF-003 | Latency KDS update (order baru → tampil) | < 3 detik |
| NFR-PERF-004 | Waktu cetak struk | < 5 detik |
| NFR-PERF-005 | Kapasitas concurrent order | ≥ 50 order simultan |
| NFR-PERF-006 | Database query laporan harian | < 3 detik |

### 6.2 Ketersediaan & Reliabilitas

| ID | Kebutuhan | Target |
|----|-----------|--------|
| NFR-AVAIL-001 | Uptime sistem (jam operasional) | ≥ 99.5% |
| NFR-AVAIL-002 | Mode offline — order tetap bisa dibuat | Must have |
| NFR-AVAIL-003 | Auto-sync saat koneksi kembali | Must have |
| NFR-AVAIL-004 | Backup database otomatis | Harian |
| NFR-AVAIL-005 | Recovery time setelah crash | < 15 menit |

### 6.3 Skalabilitas

| ID | Kebutuhan | Target |
|----|-----------|--------|
| NFR-SCALE-001 | Support multi-device (kasir, KDS, manager) | ≥ 10 device |
| NFR-SCALE-002 | Data retention transaksi | ≥ 2 tahun |
| NFR-SCALE-003 | Arsitektur siap multi-outlet | Fase 3a (sebagian selesai) |

### 6.4 Keamanan

| ID | Kebutuhan | Target |
|----|-----------|--------|
| NFR-SEC-001 | Password di-hash (bcrypt/argon2) | Must |
| NFR-SEC-002 | Komunikasi HTTPS/TLS | Must |
| NFR-SEC-003 | Session timeout otomatis | 30 menit (configurable) |
| NFR-SEC-004 | Proteksi SQL injection, XSS, CSRF | Must |
| NFR-SEC-005 | Enkripsi data pembayaran sensitif | Must |
| NFR-SEC-006 | Audit log untuk aksi kritis | Must |

### 6.5 Usability

| ID | Kebutuhan | Target |
|----|-----------|--------|
| NFR-UX-001 | Interface kasir dapat dioperasikan ≤ 3 klik per aksi utama | Must |
| NFR-UX-002 | KDS dapat dibaca dari jarak 2 meter | Must |
| NFR-UX-003 | Responsive untuk tablet 10" dan desktop | Must |
| NFR-UX-004 | Bahasa UI: Indonesia (default), English (opsional) | Should |

### 6.6 Kompatibilitas

| ID | Kebutuhan | Target |
|----|-----------|--------|
| NFR-COMP-001 | Browser: Chrome, Edge, Firefox (versi terbaru) | Must |
| NFR-COMP-002 | OS: Windows 10+, Android (tablet) | Must |
| NFR-COMP-003 | Printer thermal: ESC/POS protocol | Must |
| NFR-COMP-004 | Resolusi minimum | 1024 × 768 |

---

## 7. Arsitektur Sistem

### 7.1 Arsitektur Umum

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ POS      │  │ KDS      │  │ Manager  │  │ Inventory│    │
│  │ Terminal │  │ Display  │  │ Dashboard│  │ Panel    │    │
│  │ (Web App)│  │ (Web App)│  │ (Web App)│  │ (Web App)│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼──────────────┼──────────────┼──────────────┼──────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER               │
└──────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Order   │ │ Kitchen │ │ Payment │ │Inventory│           │
│  │ Service │ │ Service │ │ Service │ │ Service │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Menu    │ │ Report  │ │ Auth    │ │ Notif   │           │
│  │ Service │ │ Service │ │ Service │ │ Service │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└──────────────────────────┬───────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MySQL 8+   │  │    Redis     │  │  WebSocket   │
│  (Primary DB)│  │ (Cache/PubSub│  │  Server      │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 7.2 Rekomendasi Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Frontend | React / Next.js + TypeScript | Component-based, SSR, ecosystem besar |
| UI Framework | Tailwind CSS + shadcn/ui | Rapid development, konsisten |
| State Management | Zustand / React Query | Real-time state + server cache |
| Backend | Node.js (NestJS) / Laravel | RESTful API, mature ecosystem |
| Database | MySQL 8+ (implementasi) | Relational, ACID — Prisma ORM |
| Cache & PubSub | Redis | Real-time KDS, session cache |
| Real-time | Socket.io / WebSocket | KDS live update, notifikasi |
| Auth | JWT + Refresh Token | Stateless, scalable |
| Printer | ESC/POS library | Standard thermal printer |
| Deployment | Docker + VPS / Cloud | Portable, mudah maintain |

### 7.3 Pola Komunikasi Real-Time (KDS)

```
Cashier (Confirm Order)
    │
    ▼
Order Service ──publish──► Redis Pub/Sub ──subscribe──► KDS Client
    │
    ▼
Inventory Service (auto-deduct)
```

### 7.4 Arsitektur Dual-Client (v1.1)

Pada versi 1.1, sistem mengadopsi arsitektur **dual-client** dengan dua aplikasi klien yang terintegrasi pada **satu backend API**:

| Aplikasi Klien | Platform | Peran Pengguna |
|----------------|----------|----------------|
| **Restaurant POS Dashboard** | Peramban web | Admin, Manager, Inventory, Kitchen (KDS) |
| **Restaurant POS Mobile** | Android & iOS | Kasir, Waiter |

Diagram arsitektur, pembagian fitur per klien, serta mekanisme autentikasi mobile diuraikan pada **Lampiran F**.

---

## 8. Desain Database

### 8.1 Entity Relationship Diagram (Konseptual)

```
outlets ────────< users ──────────< orders >────────── order_items >──── menu_items
   │                │                  │                    │                  │
   ├───────< tables │                  │                    │            menu_categories
   ├───────< shifts │               payments            order_item_               │
   │                │                  │               modifiers               │
   │                └──────── transaction_logs                              recipes
   │                                                                            │
   │                                                                     ingredients
   │                                                                            │
   │                                                               ingredient_stocks
   │                                                                            │
   └────────────────────────────────────────────────────────────── stock_movements
                                                                              suppliers
```

### 8.2 Definisi Tabel

#### `outlets`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| name | VARCHAR(100) | Nama cabang |
| code | VARCHAR(20) UNIQUE | Nullable, kode singkat (contoh: OUT1) |
| address | TEXT | Nullable |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

#### `users`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| outlet_id | FK → outlets | Cabang tempat user bertugas |
| username | VARCHAR(50) UNIQUE | — |
| password_hash | VARCHAR(255) | bcrypt |
| full_name | VARCHAR(100) | — |
| role | ENUM | admin, manager, cashier, waiter, kitchen, inventory |
| pin_code | VARCHAR(10) | Nullable, untuk quick login |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

#### `tables`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| outlet_id | FK → outlets | — |
| table_number | VARCHAR(10) | UNIQUE per outlet (bukan global) |
| capacity | INT | Jumlah kursi |
| area | VARCHAR(50) | Indoor, outdoor, VIP |
| status | ENUM | available, occupied, reserved |
| is_active | BOOLEAN | — |

#### `menu_categories`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| name | VARCHAR(100) | — |
| sort_order | INT | Urutan tampil |
| is_active | BOOLEAN | — |

#### `menu_items`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| category_id | FK → menu_categories | — |
| name | VARCHAR(150) | — |
| description | TEXT | Nullable |
| price | DECIMAL(12,2) | Harga jual |
| image_url | VARCHAR(255) | Nullable |
| is_available | BOOLEAN | Sold out toggle |
| station | VARCHAR(50) | grill, bar, pastry (untuk KDS filter) |
| is_active | BOOLEAN | — |

#### `menu_modifiers`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| menu_item_id | FK → menu_items | — |
| name | VARCHAR(100) | Contoh: "Extra Pedas" |
| extra_price | DECIMAL(12,2) | Default 0 |

#### `orders`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| outlet_id | FK → outlets | — |
| order_number | VARCHAR(20) UNIQUE | Auto-generated |
| order_type | ENUM | dine_in, takeaway |
| table_id | FK → tables | Nullable (takeaway) |
| status | ENUM | draft, confirmed, preparing, ready, served, paid, void |
| subtotal | DECIMAL(12,2) | — |
| tax_amount | DECIMAL(12,2) | — |
| service_charge | DECIMAL(12,2) | — |
| discount_amount | DECIMAL(12,2) | Default 0 |
| total_amount | DECIMAL(12,2) | — |
| created_by | FK → users | Kasir/waiter |
| confirmed_at | TIMESTAMP | Nullable |
| paid_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

#### `order_items`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| order_id | FK → orders | — |
| menu_item_id | FK → menu_items | — |
| quantity | INT | Min 1 |
| unit_price | DECIMAL(12,2) | Harga saat order |
| subtotal | DECIMAL(12,2) | qty × unit_price + modifiers |
| notes | TEXT | Nullable |
| status | ENUM | pending, preparing, ready, served |
| created_at | TIMESTAMP | — |

#### `order_item_modifiers`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| order_item_id | FK → order_items | — |
| modifier_id | FK → menu_modifiers | — |
| extra_price | DECIMAL(12,2) | — |

#### `payments`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| order_id | FK → orders | — |
| payment_method | ENUM | cash, card, digital_wallet |
| amount | DECIMAL(12,2) | — |
| change_amount | DECIMAL(12,2) | Untuk cash |
| reference_number | VARCHAR(100) | Nullable, untuk digital |
| status | ENUM | pending, completed, refunded |
| processed_by | FK → users | — |
| paid_at | TIMESTAMP | — |

#### `receipts`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| order_id | FK → orders | — |
| receipt_number | VARCHAR(30) UNIQUE | — |
| type | ENUM | print, email |
| sent_to | VARCHAR(150) | Email jika e-receipt |
| created_at | TIMESTAMP | — |

#### `ingredients`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| name | VARCHAR(150) | — |
| unit | VARCHAR(20) | kg, gram, liter, pcs |
| min_stock_level | DECIMAL(10,2) | Threshold alert |
| is_active | BOOLEAN | — |

#### `ingredient_stocks`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| ingredient_id | FK → ingredients | — |
| current_stock | DECIMAL(10,2) | — |
| last_updated | TIMESTAMP | — |

#### `recipes` (BOM)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| menu_item_id | FK → menu_items | — |
| ingredient_id | FK → ingredients | — |
| quantity_needed | DECIMAL(10,2) | Per 1 porsi |

#### `stock_movements`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| ingredient_id | FK → ingredients | — |
| movement_type | ENUM | in, out, adjustment |
| quantity | DECIMAL(10,2) | — |
| reference_type | VARCHAR(50) | order, restock, opname |
| reference_id | UUID / BIGINT | FK ke sumber |
| notes | TEXT | Nullable |
| created_by | FK → users | — |
| created_at | TIMESTAMP | — |

#### `suppliers`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| name | VARCHAR(150) | — |
| contact_person | VARCHAR(100) | — |
| phone | VARCHAR(20) | — |
| email | VARCHAR(100) | Nullable |
| is_active | BOOLEAN | — |

#### `transaction_logs`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| order_id | FK → orders | — |
| action | VARCHAR(50) | created, confirmed, paid, void, refunded |
| details | JSONB | Snapshot data |
| performed_by | FK → users | — |
| created_at | TIMESTAMP | — |

#### `settings`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID / BIGINT PK | — |
| key | VARCHAR(100) UNIQUE | — |
| value | TEXT | — |
| description | TEXT | — |

> **Contoh settings:** `tax_percentage`, `service_charge_percentage`, `receipt_header`, `currency`, `invoice_prefix`

---

## 9. Desain Modul & API

### 9.1 Struktur Endpoint API

Base URL: `/api/v1`

#### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/login` | Login username/password |
| POST | `/auth/pin-login` | Login PIN cepat |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Profil user saat ini |

#### Orders
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/orders` | List order (filter status, date) |
| POST | `/orders` | Buat order baru |
| GET | `/orders/:id` | Detail order |
| PUT | `/orders/:id` | Update order |
| POST | `/orders/:id/items` | Tambah item |
| DELETE | `/orders/:id/items/:itemId` | Hapus item |
| POST | `/orders/:id/confirm` | Konfirmasi order |
| POST | `/orders/:id/void` | Void order |
| GET | `/orders/:id/bill` | Generate tagihan |

#### Tables
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/tables` | List semua meja + status |
| POST | `/tables` | Tambah meja |
| PUT | `/tables/:id` | Update meja |
| DELETE | `/tables/:id` | Hapus meja |

#### Menu
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/menu/categories` | List kategori |
| GET | `/menu/items` | List item (filter kategori) |
| POST | `/menu/items` | Tambah item |
| PUT | `/menu/items/:id` | Update item |
| PATCH | `/menu/items/:id/availability` | Toggle sold out |

#### Kitchen (KDS)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/kitchen/orders` | Order aktif untuk KDS |
| PATCH | `/kitchen/items/:id/status` | Update status item |
| WS | `/ws/kitchen` | WebSocket real-time updates |

#### Payments
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/payments` | Proses pembayaran |
| POST | `/payments/:id/refund` | Refund |
| GET | `/payments` | List pembayaran |

#### Inventory
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/inventory/ingredients` | List bahan + stok |
| POST | `/inventory/ingredients` | Tambah bahan |
| POST | `/inventory/restock` | Input restock |
| GET | `/inventory/movements` | Riwayat pergerakan |
| GET | `/inventory/alerts` | Stok di bawah minimum |

#### Reports
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/reports/daily-summary` | Ringkasan harian |
| GET | `/reports/revenue-by-category` | Revenue per kategori |
| GET | `/reports/staff-performance` | Performa staff |
| GET | `/reports/best-sellers` | Item terlaris |
| GET | `/reports/export` | Export PDF/Excel |

### 9.2 Contoh Payload — Create Order

**Request:**
```json
POST /api/v1/orders
{
  "order_type": "dine_in",
  "table_id": "uuid-table-a1",
  "items": [
    {
      "menu_item_id": "uuid-nasi-goreng",
      "quantity": 2,
      "notes": "Tanpa terasi",
      "modifiers": ["uuid-extra-pedas"]
    },
    {
      "menu_item_id": "uuid-es-teh",
      "quantity": 2,
      "modifiers": []
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-order-001",
    "order_number": "ORD-20260608-001",
    "order_type": "dine_in",
    "table_id": "uuid-table-a1",
    "status": "draft",
    "subtotal": 85000,
    "tax_amount": 8500,
    "service_charge": 4250,
    "total_amount": 97750,
    "items": [
      {
        "id": "uuid-item-001",
        "menu_item_name": "Nasi Goreng Spesial",
        "quantity": 2,
        "unit_price": 35000,
        "subtotal": 72000,
        "notes": "Tanpa terasi",
        "status": "pending"
      },
      {
        "id": "uuid-item-002",
        "menu_item_name": "Es Teh Manis",
        "quantity": 2,
        "unit_price": 6500,
        "subtotal": 13000,
        "status": "pending"
      }
    ],
    "created_at": "2026-06-08T10:30:00Z"
  }
}
```

### 9.3 Event Real-Time (WebSocket)

| Event | Direction | Payload | Trigger |
|-------|-----------|---------|---------|
| `order:new` | Server → KDS | Order data | Order confirmed |
| `order:status_update` | Server → All | order_id, status | Status change |
| `item:ready` | Server → POS | order_id, item_id | Kitchen mark ready |
| `stock:low_alert` | Server → Inventory | ingredient, level | Stok < minimum |
| `payment:completed` | Server → POS | order_id, receipt | Payment success |

---

## 10. Desain Antarmuka (UI/UX)

### 10.1 Daftar Halaman & Aplikasi

| No | Halaman / Aplikasi | User | Deskripsi |
|----|-------------------|------|-----------|
| 1 | Login | Semua | Username/password atau PIN |
| 2 | **Mobile POS App** | Cashier, Waiter | Order, meja, pembayaran di Android/iOS |
| 3 | Table View (Mobile) | Cashier, Waiter | Pilih meja dine-in / takeaway |
| 4 | Order Screen (Mobile) | Cashier, Waiter | Menu + keranjang + modifier |
| 5 | Payment Screen (Mobile) | Cashier | Tagihan, cash/card/QRIS, split bill |
| 6 | Shift Screen (Mobile) | Cashier | Buka/tutup shift & modal kas |
| 7 | KDS Screen (Dashboard Web) | Kitchen | Daftar order dapur di browser |
| 8 | Menu Management (Dashboard) | Admin, Manager | Kelola menu & ketersediaan |
| 9 | Inventory Panel (Dashboard) | Inventory, Manager | Stok, restock, opname |
| 10 | Reports Dashboard (Dashboard) | Admin, Manager | Grafik & laporan penjualan |
| 11 | Suppliers (Dashboard) | Inventory, Manager | Data supplier |
| 12 | Shift Overview (Dashboard) | Admin, Manager | Monitoring shift kasir |
| 13 | Settings (Dashboard) | Admin | Pajak, service charge, prefix struk |

### 10.2 Wireframe — POS Dashboard (Cashier)

```
┌─────────────────────────────────────────────────────────────────┐
│  🏪 Restaurant POS    Shift: Pagi    👤 Rina (Cashier)  [Logout]│
├────────────────┬────────────────────────────────────────────────┤
│                │                                                │
│  TABLE VIEW    │   MENU BROWSER                                 │
│  ┌──┐ ┌──┐    │   ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │A1│ │A2│    │   │ Makanan │ │ Minuman │ │ Dessert │       │
│  │🟢│ │🔴│    │   └─────────┘ └─────────┘ └─────────┘       │
│  └──┘ └──┘    │                                                │
│  ┌──┐ ┌──┐    │   ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │B1│ │B2│    │   │Nasi Goreng│ │Mie Goreng│ │Ayam Bakar│     │
│  │🟢│ │🟡│    │   │ Rp 35.000│ │ Rp 32.000│ │ Rp 40.000│     │
│  └──┘ └──┘    │   └──────────┘ └──────────┘ └──────────┘     │
│                │                                                │
│  🟢 Available  ├────────────────────────────────────────────────┤
│  🔴 Occupied   │   CURRENT ORDER — Meja A2                      │
│  🟡 Reserved   │   ┌────────────────────────────────────────┐  │
│                │   │ 2x Nasi Goreng Spesial      Rp 70.000 │  │
│                │   │ 1x Es Teh Manis              Rp  6.500 │  │
│                │   │ 1x Ayam Bakar                Rp 40.000 │  │
│                │   ├────────────────────────────────────────┤  │
│                │   │ Subtotal                    Rp 116.500 │  │
│                │   │ Pajak (10%)                  Rp 11.650 │  │
│                │   │ Service (5%)                  Rp  5.825 │  │
│                │   │ TOTAL                       Rp 133.975 │  │
│                │   └────────────────────────────────────────┘  │
│                │   [Hold]  [Confirm → Kitchen]  [💳 Pay]        │
└────────────────┴────────────────────────────────────────────────┘
```

### 10.3 Wireframe — Kitchen Display System (KDS)

```
┌─────────────────────────────────────────────────────────────────┐
│  🍳 KITCHEN DISPLAY                    Station: [All ▼]  🔊 ON │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐│
│  │ #ORD-0612-015   │  │ #ORD-0612-016   │  │ #ORD-0612-017  ││
│  │ 🪑 Meja A2      │  │ 🥡 Takeaway     │  │ 🪑 Meja B1     ││
│  │ ⏱ 05:32         │  │ ⏱ 03:15         │  │ ⏱ 01:45       ││
│  │─────────────────│  │─────────────────│  │────────────────││
│  │ 2x Nasi Goreng  │  │ 1x Mie Goreng   │  │ 1x Ayam Bakar  ││
│  │   ⚠ Extra pedas │  │ 2x Es Jeruk     │  │ 1x Nasi Putih  ││
│  │ 1x Ayam Bakar   │  │                 │  │                ││
│  │─────────────────│  │─────────────────│  │────────────────││
│  │ [Preparing]     │  │ [Preparing]     │  │ [✅ Ready]     ││
│  └─────────────────┘  └─────────────────┘  └────────────────┘│
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                    │
│  │ #ORD-0612-018   │  │ #ORD-0612-019   │                    │
│  │ 🪑 Meja A1      │  │ 🥡 Takeaway     │                    │
│  │ ⏱ 00:45  🆕     │  │ ⏱ 00:12  🆕     │                    │
│  │ ...             │  │ ...             │                    │
│  └─────────────────┘  └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4 Wireframe — Payment Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  💳 PAYMENT — Order #ORD-0612-015 — Meja A2                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Item Details                    BILL SUMMARY                    │
│   ─────────────────────           ──────────────────             │
│   2x Nasi Goreng    Rp 70.000    Subtotal       Rp 116.500    │
│   1x Es Teh Manis   Rp  6.500    Pajak 10%       Rp  11.650    │
│   1x Ayam Bakar     Rp 40.000    Service 5%       Rp   5.825    │
│                                   Diskon           Rp       0    │
│                                   ─────────────────────────      │
│                                   TOTAL          Rp 133.975    │
│                                                                 │
│   PAYMENT METHOD                                                │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│   │  💵 Cash │  │  💳 Card │  │  📱 QRIS │                    │
│   └──────────┘  └──────────┘  └──────────┘                    │
│                                                                 │
│   Amount Received: [ Rp 150.000    ]    Change: Rp 16.025     │
│                                                                 │
│   [Cancel]                    [✅ Confirm Payment & Print]       │
└─────────────────────────────────────────────────────────────────┘
```

### 10.5 Wireframe — Reports Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 REPORTS DASHBOARD              📅 8 Jun 2026  [Export ▼]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Total    │  │ Orders   │  │ Avg      │  │ Top Item │       │
│  │ Sales    │  │ Today    │  │ Ticket   │  │          │       │
│  │Rp 4.5 Jt │  │   87     │  │Rp 51.724 │  │Nasi Goreng│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  Revenue by Category              Sales Trend (7 days)          │
│  ┌─────────────────────┐         ┌─────────────────────┐      │
│  │ Makanan  █████ 62%  │         │     📈 Line Chart    │      │
│  │ Minuman  ███   28%  │         │                      │      │
│  │ Dessert  █      10% │         │                      │      │
│  └─────────────────────┘         └─────────────────────┘      │
│                                                                 │
│  Staff Performance                                              │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ Rina (Cashier)  — 45 orders — Rp 2.3 Jt              │      │
│  │ Budi (Waiter)   — 32 orders — Rp 1.8 Jt              │      │
│  └───────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 10.6 Design Guidelines

| Aspek | Spesifikasi |
|-------|-------------|
| Color — Primary | `#2563EB` (Blue) — Order actions |
| Color — Kitchen | `#16A34A` (Green) — KDS, ready status |
| Color — Payment | `#7C3AED` (Purple) — Payment flow |
| Color — Inventory | `#EA580C` (Orange) — Stock alerts |
| Color — Reports | `#0D9488` (Teal) — Dashboard |
| Font | Inter / system sans-serif |
| Touch target minimum | 44 × 44 px |
| KDS font size | ≥ 18px (readable dari jarak jauh) |

---

## 11. Integrasi Eksternal

| Integrasi | Tujuan | Prioritas | Protokol |
|-----------|--------|:---------:|----------|
| Thermal Printer | Cetak struk | Must | ESC/POS via USB/Network |
| POS Terminal (Card) | Pembayaran kartu | Must | API vendor / SDK |
| QRIS Payment Gateway | Pembayaran digital | Should | REST API |
| Email Service (SMTP) | E-receipt | Should | SMTP / SendGrid |
| WhatsApp Business API | Notifikasi order siap | Could | Fase 2 |

---

## 12. Keamanan & Hak Akses

### 12.1 Autentikasi

- Login standar: username + password (min 8 karakter, 1 huruf besar, 1 angka).
- Quick login: PIN 4–6 digit untuk kasir dan kitchen (session terbatas).
- JWT access token (expire: 1 jam) + refresh token (expire: 7 hari).
- Brute-force protection: lock account setelah 5 percobaan gagal.

### 12.2 Otorisasi

- Role-Based Access Control (RBAC) sesuai matriks di §3.2.
- Setiap endpoint API divalidasi role di middleware.
- Aksi kritis (void, refund, diskon) memerlukan elevated permission.

### 12.3 Audit Trail

Semua aksi berikut wajib dicatat di `transaction_logs`:

| Aksi | Data yang Dicatat |
|------|-------------------|
| Order created/confirmed/voided | Order snapshot, user, timestamp |
| Payment processed/refunded | Amount, method, user |
| Stock adjustment | Before/after qty, reason |
| User login/logout | IP, device, timestamp |
| Settings changed | Old/new value, user |

---

## 13. Aturan Bisnis (Business Rules)

| ID | Aturan | Modul |
|----|--------|-------|
| BR-001 | Order number format: `ORD-YYYYMMDD-XXX` (auto-increment per hari) | Order |
| BR-002 | Order yang sudah `paid` tidak dapat diedit | Order |
| BR-003 | Void order hanya bisa dilakukan sebelum `paid` | Order |
| BR-004 | Tax dihitung dari subtotal setelah diskon | Payment |
| BR-005 | Service charge configurable (%), dihitung setelah tax | Payment |
| BR-006 | Kembalian dihitung: amount_received - total_amount | Payment |
| BR-007 | Auto-deduct inventory terjadi saat order `confirmed`, bukan `paid` | Inventory |
| BR-008 | Alert stok muncul jika current_stock < min_stock_level | Inventory |
| BR-009 | Item `sold out` tidak bisa ditambahkan ke order baru | Menu |
| BR-010 | Meja `occupied` tidak bisa dipilih order baru | Table |
| BR-011 | KDS hanya menampilkan order dengan status `confirmed` s/d `ready` | Kitchen |
| BR-012 | Laporan harian reset per shift/tanggal operasional (configurable) | Reports |
| BR-013 | Diskon maksimal 50% (configurable, perlu approval manager) | Payment |
| BR-014 | Refund hanya untuk order dalam 24 jam terakhir (configurable) | Payment |

---

## 14. Strategi Pengujian

### 14.1 Jenis Testing

| Jenis | Scope | Tools |
|-------|-------|-------|
| Unit Test | Service, utility, kalkulasi | Jest / PHPUnit |
| Integration Test | API endpoint, database | Supertest / Pest |
| E2E Test | Full flow: order → kitchen → pay | Playwright / Cypress |
| Performance Test | Load 50 concurrent orders | k6 / Artillery |
| UAT | Semua flow oleh end-user | Manual test script |

### 14.2 Skenario UAT Kritis

| No | Skenario | Expected Result |
|----|----------|-----------------|
| 1 | Buat order dine-in, confirm, bayar cash | Order paid, struk tercetak, meja available |
| 2 | Buat order takeaway, confirm | Muncul di KDS, tidak terikat meja |
| 3 | Kitchen mark ready | Notifikasi ke POS, status updated |
| 4 | Order confirmed dengan BOM | Stok bahan berkurang otomatis |
| 5 | Stok di bawah minimum | Alert muncul di inventory panel |
| 6 | Void order sebelum bayar | Order cancelled, stok dikembalikan |
| 7 | Refund setelah bayar | Payment status refunded, log tercatat |
| 8 | Login PIN kasir | Masuk ke Mobile App, shift terbuka |
| 9 | Export laporan harian PDF | File terdownload dengan data benar |
| 10 | Koneksi putus saat order | Order tersimpan lokal, sync saat online |

---

## 15. Deployment & Operasional

### 15.1 Environment

| Environment | Tujuan | URL Contoh |
|-------------|--------|------------|
| Development | Pengembangan lokal | `localhost:3001` |
| Staging | Testing & UAT | `staging.pos.cafe.com` |
| Production | Live outlet | `pos.cafe.com` |

### 15.2 Infrastruktur Minimum (Production)

| Komponen | Spesifikasi |
|----------|-------------|
| Server (VPS/Cloud) | 2 vCPU, 4 GB RAM, 50 GB SSD |
| Database | MySQL 8+ / MariaDB 10+ |
| Cache | Redis 7+ |
| SSL | Let's Encrypt / Cloudflare |
| Backup | Daily automated DB backup |
| Monitoring | Uptime check + error logging |

### 15.3 Perangkat Outlet

| Perangkat | Qty | Spesifikasi |
|-----------|:---:|-------------|
| Smartphone/Tablet Kasir | 1–2 | Android/iOS — install Restaurant POS Mobile |
| PC/Laptop Dashboard | 1 | Browser untuk manage & laporan |
| KDS Monitor | 1–2 | Min 21" monitor/tablet di dapur (browser) |
| Thermal Printer | 1–2 | 58mm/80mm ESC/POS |
| Network | — | Wi-Fi/LAN stabil, min 10 Mbps |

---

## 16. Rencana Pengembangan (Milestone)

### Ringkasan Status (per Juni 2026)

| Fase | Status | Keterangan |
|------|:------:|------------|
| Fase 1 — MVP | Selesai | Order, KDS, Payment, Inventory, Reports |
| Fase 2 — Enhancement | Selesai | Modifier, split bill, QRIS, void/refund, shift, opname, supplier |
| Arsitektur Dual-Client | Selesai | Dashboard Web + Mobile Application Android/iOS (Lampiran F) |
| Fase 3a — Multi-Outlet | Selesai | Model Outlet, isolasi data operasional per cabang, halaman kelola outlet |
| Fase 3b — Inventori per Outlet | Selesai | Stok bahan baku terpisah per cabang |
| Fase 3c — QR Menu Pelanggan | Selesai | Halaman publik `/qr/[code]`, API public order |
| Fase 3d — Loyalty Program | Selesai | Poin pelanggan, earn/redeem saat pembayaran |
| Fase 3 — Scale (sisanya) | Selesai (dev) | Delivery webhook, offline queue mobile, e-receipt stub, forecasting |
| Database MySQL | Selesai (dev) | Migrasi dari SQLite ke MySQL 8+ + Prisma adapter |

### Fase 1 — MVP (8–10 minggu) — Selesai

| Minggu | Deliverable | Modul |
|:------:|-------------|-------|
| 1–2 | Setup project, database, auth, user management | Foundation |
| 3–4 | Menu management, table management | Master Data |
| 5–6 | Order flow (create, confirm, send to kitchen) | Order + KDS |
| 7 | Payment flow (cash, print receipt) | Payment |
| 8 | Inventory auto-deduct + basic reports | Inventory + Reports |
| 9–10 | Testing, bug fix, UAT, deployment | QA + Deploy |

**MVP mencakup:** Order → KDS → Payment (cash) → Basic Inventory → Daily Report

### Fase 2 — Enhancement (4–6 minggu) — Selesai

| Deliverable | Status |
|-------------|:------:|
| Pembayaran kartu & digital wallet (QRIS) | Selesai |
| Modifier menu, split bill | Selesai |
| Dashboard analytics + date filter | Selesai |
| Stock opname & supplier management | Selesai |
| PIN login & shift management | Selesai |
| Void order & refund (manager) | Selesai |
| Menu management & settings (admin) | Selesai |
| E-receipt via email | Direncanakan Fase 3 |

### Fase 2b — Arsitektur Dual-Client — Selesai

| Deliverable | Status |
|-------------|:------:|
| Dashboard Web untuk Admin, Manager, Inventory, dan KDS | Selesai |
| Mobile Application Android/iOS untuk Kasir dan Waiter | Selesai |
| Autentikasi Bearer token dan CORS untuk klien mobile | Selesai |
| Backend API terpusat (`pos-app`) | Selesai |

### Fase 3a — Multi-Outlet — Selesai

| Deliverable | Status |
|-------------|:------:|
| Model `outlets` dan relasi `outlet_id` pada user, meja, order, shift | Selesai |
| Isolasi data operasional per outlet (order, payment, KDS, shift, laporan) | Selesai |
| API kelola outlet (`GET/POST /api/outlets`, `PATCH /api/outlets/:id`) | Selesai |
| Halaman dashboard kelola outlet (admin) | Selesai |
| Filter laporan harian per outlet (admin) | Selesai |
| Menu global, inventori per-outlet | Selesai |

### Fase 3b — Inventori per Outlet — Selesai

| Deliverable | Status |
|-------------|:------:|
| `ingredient_stocks` per `outlet_id` | Selesai |
| `stock_movements` per outlet | Selesai |
| API opname/restock/alerts filter outlet | Selesai |

### Fase 3c — QR Menu Pelanggan — Selesai

| Deliverable | Status |
|-------------|:------:|
| Halaman publik `/qr/[outletCode]` | Selesai |
| `GET /api/public/menu`, `POST /api/public/orders` | Selesai |
| Order `source: qr_menu` auto-konfirmasi ke dapur | Selesai |
| Dashboard QR links (`/qr-links`) | Selesai |

### Fase 3d — Loyalty Program — Selesai

| Deliverable | Status |
|-------------|:------:|
| Model `customers` + `loyalty_transactions` | Selesai |
| Earn poin saat pembayaran (1 poin / Rp 1.000) | Selesai |
| Redeem poin jadi diskon (1 poin = Rp 100) | Selesai |
| Halaman dashboard loyalty | Selesai |

### Fase 3e — Thermal Receipt — Selesai (basic)

| Deliverable | Status |
|-------------|:------:|
| `GET /api/orders/[id]/receipt` format teks ESC/POS | Selesai |

### Fase 3 — Scale (6–8 minggu) — Selesai (Development)

| Deliverable | Status |
|-------------|:------:|
| Delivery aggregator webhook (GoFood/GrabFood stub) | Selesai |
| Advanced analytics & sales forecasting | Selesai |
| E-receipt via email (stub — log server) | Selesai |
| Offline queue mobile + sync | Selesai |
| Hold/rush order, merge table, reservation, PO | Selesai |
| Login audit, users CRUD, stock history | Selesai |
| KDS SSE + sound notification | Selesai |
| Reports period filter, CSV/PDF export, ingredient usage | Selesai |
| Manager discount + multi-method payment | Selesai |
| Thermal receipt text API | Selesai (basic) |

**Database dev:** MySQL 8+ via Prisma (`@prisma/adapter-mariadb`).  
**Belum production:** VPS deploy, HTTPS, backup otomatis, printer Bluetooth/USB native, SMTP/WhatsApp API live.

---

## 17. Glosarium

| Istilah | Definisi |
|---------|----------|
| BOM | Bill of Materials — komposisi bahan baku per menu |
| KDS | Kitchen Display System — layar pesanan di dapur |
| POS | Point of Sale — sistem kasir |
| Void | Pembatalan order sebelum dibayar |
| Refund | Pengembalian dana setelah pembayaran |
| Modifier | Opsi tambahan pada item menu (level pedas, ukuran, dll.) |
| Shift | Periode kerja kasir (buka/tutup dengan modal kas) |
| Dashboard | Aplikasi web manajemen (laporan, menu, inventory, settings) |
| Mobile App | Aplikasi native Android/iOS untuk operasional kasir/waiter |
| Dual-Client | Arsitektur dua program klien (Dashboard + Mobile) dengan satu backend |
| Takeaway | Pesanan bawa pulang (bukan dine-in) |
| UAT | User Acceptance Testing — pengujian oleh end-user |
| ESC/POS | Protokol standar printer thermal |
| QRIS | Quick Response Code Indonesian Standard |

---

## 18. Lampiran

### Lampiran A — Status Order (State Machine)

```
                    ┌─────────┐
                    │  draft  │
                    └────┬────┘
                         │ confirm
                         ▼
                    ┌─────────┐
              ┌─────│confirmed│─────┐
              │     └────┬────┘     │
              │ void     │          │
              ▼          ▼          │
         ┌────────┐  ┌─────────┐   │
         │  void  │  │preparing│   │
         └────────┘  └────┬────┘   │
                           │        │
                           ▼        │
                      ┌─────────┐   │
                      │  ready  │   │
                      └────┬────┘   │
                           │ serve  │
                           ▼        │
                      ┌─────────┐   │
                      │ served  │   │
                      └────┬────┘   │
                           │ pay    │
                           ▼        │
                      ┌─────────┐   │
                      │  paid   │◄──┘
                      └─────────┘
```

### Lampiran B — Status Order Item (KDS)

```
pending → preparing → ready → served
```

### Lampiran C — Format Nomor Transaksi

| Tipe | Format | Contoh |
|------|--------|--------|
| Order Number | `ORD-YYYYMMDD-XXX` | ORD-20260608-001 |
| Receipt Number | `RCP-YYYYMMDD-XXX` | RCP-20260608-001 |
| Invoice Number | `INV-YYYYMMDD-XXX` | INV-20260608-001 |

### Lampiran D — Kalkulasi Tagihan

```
subtotal       = Σ (item_qty × unit_price + modifier_prices)
discount       = subtotal × discount_percentage  (atau nominal tetap)
taxable_amount = subtotal - discount
tax_amount     = taxable_amount × tax_percentage
service_charge = taxable_amount × service_charge_percentage
total_amount   = taxable_amount + tax_amount + service_charge
change_amount  = amount_received - total_amount  (hanya cash)
```

### Lampiran E — Checklist Review Dokumen

| Item | Status |
|------|:------:|
| Semua 5 workflow tercakup | ✅ |
| Functional requirements terdefinisi | ✅ |
| Database schema lengkap | ✅ |
| API endpoints terdokumentasi | ✅ |
| Wireframe halaman utama | ✅ |
| Business rules jelas | ✅ |
| Milestone pengembangan | ✅ |
| Testing strategy | ✅ |
| Arsitektur dual-client (Dashboard + Mobile) | ✅ |
| Status implementasi Fase 1 & 2 | ✅ |
| Lampiran F — pembagian fitur per client | ✅ |

### Lampiran F — Arsitektur Dual-Client (Dashboard + Mobile)

> **Keterangan:** Lampiran ini merupakan perluasan dokumentasi arsitektur klien dan tidak mengubah workflow, desain database, maupun kebutuhan fungsional pada Bab 1–18.

#### F.1 Konsep Dua Program

| Program | Platform | Pengguna | Fungsi Utama |
|---------|----------|----------|--------------|
| **Restaurant POS Dashboard** | Web (PC/Laptop/Tablet browser) | Admin, Manager, Inventory | Kelola menu, laporan, settings, supplier, stok, shift overview |
| **Restaurant POS Mobile** | Android & iOS (native app) | Kasir, Waiter | Order, meja, pembayaran, shift kasir |
| **Kitchen Display (KDS)** | Web di tablet/monitor dapur | Kitchen Staff | Tetap di Dashboard web (`/kitchen`) |

#### F.2 Diagram Arsitektur

```
                    ┌─────────────────────────┐
                    │   BACKEND API (satu)    │
                    │   pos-app /api/*        │
                    │   Database MySQL 8+     │
                    └───────────┬─────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Dashboard Web    │  │ Mobile App       │  │ KDS Web          │
│ (pos-app)        │  │ (pos-mobile)     │  │ (pos-app/kitchen)│
│ Reports, Menu,   │  │ Order, Payment,  │  │ Preparing, Ready │
│ Settings, Inv... │  │ Tables, Shift    │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
   Admin/Manager         Kasir/Waiter           Dapur
```

#### F.3 Pembagian Fitur per Client

| Fitur | Dashboard Web | Mobile App | KDS Web |
|-------|:-------------:|:----------:|:-------:|
| Login | ✅ | ✅ | ✅ |
| POS / Order | — | ✅ | — |
| Payment | — | ✅ | — |
| Split Bill / QRIS | — | ✅ | — |
| Shift buka/tutup | ✅ (overview) | ✅ (kasir) | — |
| Menu CRUD | ✅ | — | — |
| Reports & Analytics | ✅ | — | — |
| Settings | ✅ | — | — |
| Inventory & Supplier | ✅ | — | — |
| Kitchen Display | — | — | ✅ |
| Void / Refund | ✅ (manager) | ✅ (void) | — |

#### F.4 Autentikasi Mobile

- Aplikasi mobile melakukan autentikasi melalui `POST /api/auth/login`
- Response API menyertakan `token` (JWT) untuk header `Authorization: Bearer <token>`
- Dashboard web menggunakan cookie `pos_token` sebagai mekanisme sesi
- Kedua klien menggunakan satu backend dengan dua metode autentikasi

#### F.5 Struktur Folder Proyek

```
NEW POS/
├── RDP_Restaurant_Cafe_POS.md    # Dokumen RDP (tetap)
├── pos-app/                      # Dashboard Web + Backend API
└── pos-mobile/                   # App Android/iOS (Expo React Native)
```

---

> **Dokumen ini merupakan acuan resmi pengembangan sistem.**
> Arsitektur dual-client: Dashboard Web untuk manajemen dan pelaporan; Mobile Application untuk operasional kasir dan pelayanan.

---

*End of Document — RDP Restaurant / POS System v1.1*
