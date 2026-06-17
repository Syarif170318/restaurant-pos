# Restaurant / POS System

Proyek POS restoran — **2 program, 1 backend**, database **MySQL**.

## Struktur Proyek

```
NEW POS/
├── RDP_Restaurant_Cafe_POS.md          # Dokumen RDP v1.1
├── RDP_Restaurant_Cafe_POS.docx
├── RDP_CHECKLIST_MANUAL_TESTING.md     # Checklist uji manual
├── RDP_CHECKLIST_MANUAL_TESTING.docx
├── pos-app/                            # Dashboard Web + Backend API
└── pos-mobile/                         # App Android & iOS (Kasir)
```

## Dua Program

| Program | Folder | Untuk Siapa | Platform |
|---------|--------|-------------|----------|
| **Dashboard** | `pos-app` | Admin, Manager, Inventory, Dapur | Web browser (PC/tablet) |
| **Mobile POS** | `pos-mobile` | Kasir, Waiter | Android & iOS (Expo) |

Keduanya pakai **API yang sama** — satu database MySQL.

---

## Prasyarat

- **Node.js** 22 LTS (atau 20+)
- **MySQL** 8.0+ (XAMPP / WAMP / MySQL Workbench / MariaDB 10+)
- **Android Studio** (opsional, untuk emulator mobile)

---

## Setup Database MySQL (sekali)

1. Buat database:
   ```sql
   CREATE DATABASE pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Edit file environment:
   - **`pos-app/.env`** — koneksi MySQL + JWT:
     ```env
     DATABASE_URL="mysql://root:PASSWORD@localhost:3306/pos_db"
     ```
     > XAMPP default: password kosong → `mysql://root:@localhost:3306/pos_db`
   - **`pos-mobile/.env`** — URL backend (default emulator):
     ```env
     EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3001
     ```

3. Migrate + seed:
   ```bash
   cd pos-app
   npm install
   npx prisma migrate deploy
   npm run db:seed
   ```

---

## Cara Menjalankan

### Terminal 1 — Backend + Dashboard
```bash
cd pos-app
npm run dev
```
Buka http://localhost:3001 → login `admin` / `password123`

### Terminal 2 — Mobile App (emulator Android)
```bash
cd pos-mobile
npm install
npm start
```
Tekan **a** (perlu **Expo Go** di emulator). Atau `npm run android:build` untuk build native (butuh Java/Android Studio).

Login: `kasir1` / PIN `1111`

> API mobile emulator: `http://10.0.2.2:3001` (sudah di `pos-mobile/src/config.ts`)

### Flow Lengkap
1. **Kasir** — mobile app → buka shift → buat order
2. **Dapur** — dashboard → Kitchen (KDS)
3. **Kasir** — bayar di mobile
4. **Manager** — Reports di dashboard

---

## Akun Demo

| User | PIN | Pakai di |
|------|-----|----------|
| admin | 1234 | Dashboard |
| manager1 | 3333 | Dashboard |
| kasir1 | 1111 | Mobile (Outlet 1) |
| kasir2 | 5555 | Mobile (Outlet 2) |
| dapur1 | 2222 | Dashboard → Kitchen |
| inventory1 | 4444 | Dashboard → Inventory |

Password dashboard: `password123`

**QR Menu:** http://localhost:3001/qr/OUT1  
**Loyalty demo:** HP `081234567890`

---

## Verifikasi

```bash
cd pos-app
npm run smoke-test
```
33 skenario API otomatis.

## Dokumen Uji Manual

Buka `RDP_CHECKLIST_MANUAL_TESTING.docx` — centang setiap fitur setelah diuji.
