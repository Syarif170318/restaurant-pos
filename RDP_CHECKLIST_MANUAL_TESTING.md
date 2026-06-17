# Checklist Testing Manual — Restaurant POS

Gunakan dokumen ini untuk verifikasi setiap kebutuhan RDP.  
Centang **Ya** / **Tidak** / **N/A** setelah diuji manual.

**Prasyarat:** MySQL jalan, database `pos_db` sudah dibuat, `.env` sudah diisi.

**Cara uji:**
```bash
cd pos-app && npx prisma migrate deploy   # sekali / setelah update schema
cd pos-app && npm run db:seed             # reset data demo (opsional)
cd pos-app && npm run dev                 # http://localhost:3001
cd pos-mobile && npm run android          # emulator Android
cd pos-app && npm run smoke-test          # otomatis API — 33 skenario
```

**Akun demo:** admin/password123, kasir1/PIN 1111, dapur1/2222, manager1/3333

---

## 5.1 Order Management

| ID | Kebutuhan | Cara Uji | ✓ |
|----|-----------|----------|---|
| FR-ORD-001 | Buat order draft + nomor auto | Mobile: buat order baru, cek nomor ORD-... | |
| FR-ORD-002 | Dine-in / takeaway | Toggle tipe di mobile POS | |
| FR-ORD-003 | Kaitkan meja (dine-in) | Pilih meja, buat order | |
| FR-ORD-004 | Menu per kategori | Mobile/dashboard: menu tampil per kategori | |
| FR-ORD-005 | Tambah item + qty | Tap item, qty di order | |
| FR-ORD-006 | Modifier | Pilih item dengan modifier (Nasi Goreng + Extra Pedas) | |
| FR-ORD-007 | Catatan item | Tambah notes saat add item | |
| FR-ORD-008 | Edit order draft | Tambah/hapus item sebelum confirm | |
| FR-ORD-009 | Hapus item draft | Hapus item di draft | |
| FR-ORD-010 | Konfirmasi order | Tombol Konfirmasi → status confirmed | |
| FR-ORD-011 | Order ke KDS | Setelah confirm, muncul di Kitchen | |
| FR-ORD-012 | Void order | Void dengan alasan (mobile/dashboard) | |
| FR-ORD-013 | Split bill | Bayar sebagian item di Payment | |
| FR-ORD-014 | Hold order | Mobile: Hold/Simpan, order draft tersimpan | |

## 5.2 Table Management

| ID | Kebutuhan | Cara Uji | ✓ |
|----|-----------|----------|---|
| FR-TBL-001 | Denah/status meja | Dashboard Tables / mobile list meja | |
| FR-TBL-002 | Meja occupied saat order | Confirm order → meja occupied | |
| FR-TBL-003 | Meja available setelah bayar | Bayar lunas → meja available | |
| FR-TBL-004 | Merge meja | API/Dashboard merge table untuk order | |
| FR-TBL-005 | CRUD meja | Dashboard → Tables: tambah/edit/nonaktif | |

## 5.3 Menu Management

| ID | Kebutuhan | Cara Uji | ✓ |
|----|-----------|----------|---|
| FR-MNU-001 | CRUD kategori | Dashboard Menu / API categories | |
| FR-MNU-002 | CRUD item menu | Dashboard Menu: tambah item | |
| FR-MNU-003 | Sold out toggle | Toggle ketersediaan item | |
| FR-MNU-004 | Modifier per item | Tambah modifier di menu/BOM section | |
| FR-MNU-005 | Resep BOM | Dashboard Menu → BOM, auto-deduct saat confirm | |
| FR-MNU-006 | Harga takeaway berbeda | Set takeawayPrice, order takeaway | |
| FR-MNU-007 | Jam operasional menu | Set availableFrom/To, uji di luar jam | |

## 5.4 Kitchen (KDS)

| ID | Kebutuhan | Cara Uji | ✓ |
|----|-----------|----------|---|
| FR-KDS-001 | Real-time (SSE/polling) | Kitchen page update otomatis | |
| FR-KDS-002 | Detail item + modifier | Cek tampilan item di KDS | |
| FR-KDS-003 | Nomor meja / tipe | Tampil di card order | |
| FR-KDS-004 | Status preparing | Update item → preparing | |
| FR-KDS-005 | Status ready | Update item → ready | |
| FR-KDS-006 | Timer elapsed | Cek menit elapsed di card | |
| FR-KDS-007 | Filter station | Filter grill/bar/pastry | |
| FR-KDS-008 | Rush order | Mark Rush, badge orange | |
| FR-KDS-009 | Suara notifikasi | Toggle sound, order baru | |

## 5.5 Payment

| ID | Kebutuhan | Cara Uji | ✓ |
|----|-----------|----------|---|
| FR-PAY-001 | Generate tagihan | Subtotal + tax + service | |
| FR-PAY-002 | Cash + kembalian | Bayar cash, cek kembalian | |
| FR-PAY-003 | Kartu | Pilih metode card | |
| FR-PAY-004 | Digital wallet/QRIS | Bayar QRIS + reference | |
| FR-PAY-005 | Split multi-metode | payments[] cash+card satu order | |
| FR-PAY-006 | Diskon manager | managerDiscount + PIN manager | |
| FR-PAY-007 | Invoice number | Cek invoiceNumber setelah lunas | |
| FR-PAY-008 | Struk thermal | Lihat struk teks mobile/API receipt | |
| FR-PAY-009 | E-receipt email | emailReceipt saat bayar (cek log server) | |
| FR-PAY-010 | Refund | Manager refund dalam 24 jam | |
| FR-PAY-011 | Audit payment | Audit log / transaction_logs | |

## 5.6 Inventory

| ID | Kebutuhan | Cara Uji | ✓ |
|----|-----------|----------|---|
| FR-INV-001 | CRUD bahan baku | Dashboard Inventory + API | |
| FR-INV-002 | Auto-deduct BOM | Confirm order → stok turun | |
| FR-INV-003 | Level stok real-time | Inventory page | |
| FR-INV-004 | Alert stok rendah | Banner alert di inventory | |
| FR-INV-005 | Restock | Input restock manual | |
| FR-INV-006 | Riwayat stok | Inventory movements / Audit | |
| FR-INV-007 | Supplier CRUD | Dashboard Suppliers | |
| FR-INV-008 | Purchase order | Dashboard Purchase Orders | |
| FR-INV-009 | Stock opname | Opname adjustment | |

## 5.7 Reports

| ID | Kebutuhan | Cara Uji | ✓ |
|----|-----------|----------|---|
| FR-RPT-001 | Transaction log | Dashboard Audit | |
| FR-RPT-002 | Ringkasan harian | Reports dashboard | |
| FR-RPT-003 | Periode hari/minggu/bulan | Pilih period di Reports | |
| FR-RPT-004 | Performa staff | Section staff di Reports | |
| FR-RPT-005 | Best sellers | Section best sellers | |
| FR-RPT-006 | Metode pembayaran | Payment breakdown | |
| FR-RPT-007 | Export PDF | Tombol Print PDF | |
| FR-RPT-008 | Export CSV | Tombol Export CSV | |
| FR-RPT-009 | Grafik trend | Bar chart kategori | |
| FR-RPT-010 | Penggunaan bahan | Section ingredient usage | |
| — | Sales forecasting | Reports → Sales Forecast (proyeksi 7/30 hari) | |

## 5.8 Auth & User

| ID | Kebutuhan | Cara Uji | ✓ |
|----|-----------|----------|---|
| FR-AUTH-001 | Login password | Dashboard login | |
| FR-AUTH-002 | Login PIN | Mobile PIN login | |
| FR-AUTH-003 | RBAC per role | Coba akses menu terlarang | |
| FR-AUTH-004 | Login audit | Dashboard Audit → login logs | |
| FR-AUTH-005 | CRUD user | Dashboard Users | |
| FR-AUTH-006 | Shift management | Buka/tutup shift mobile | |

## Fase 3 & Dual-Client

| Fitur | Cara Uji | ✓ |
|-------|----------|---|
| Multi-outlet | Login kasir1 vs kasir2, data terisolasi | |
| QR Menu | http://localhost:3001/qr/OUT1 | |
| Loyalty earn/redeem | HP 081234567890, redeem di payment | |
| Delivery webhook | POST /api/delivery/webhook, terima di Delivery page | |
| Reservasi | Dashboard Reservations | |
| Mobile offline queue | Matikan server, buat order, sync saat online | |

## NFR (Non-Fungsional) — Uji Terbatas

| ID | Kebutuhan | Catatan Uji | ✓ |
|----|-----------|-------------|---|
| NFR-AVAIL-002/003 | Offline + sync | Mobile offline queue | |
| NFR-SEC-001 | Password hash | bcrypt di DB | |
| NFR-SEC-002 | HTTPS | Perlu deploy production | |
| NFR-AVAIL-004 | Backup DB | Perlu setup cron production | |

## Deployment (Bab 15) — Belum Production

| Item | Status |
|------|--------|
| MySQL dev (lokal) | ✅ MySQL 8+ / XAMPP |
| VPS + HTTPS deploy | Belum |
| Backup DB otomatis | Belum |
| APK mobile production build | Belum — Expo dev |

---

**Tester:** _______________  
**Tanggal:** _______________  
**Versi:** RDP v1.1 + Phase 3 + MySQL 8  
**Catatan temuan:**
