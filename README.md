# Restaurant / POS System

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Expo](https://img.shields.io/badge/Expo-Mobile-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)

Full-stack **Restaurant & Café POS** — web dashboard + mobile app, shared MySQL backend.

![Dashboard Preview](docs/screenshots/dashboard-preview.jpeg)

---

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Admin, manager, inventory, kitchen display (KDS), reports |
| **Mobile POS** | Cashier & waiter app — shift, orders, payments (Android/iOS) |
| **Kitchen (KDS)** | Real-time order queue for kitchen staff |
| **QR Menu** | Customer self-order via QR code |
| **Loyalty** | Customer loyalty program demo |
| **Reports** | Daily summary, CSV/PDF export, ingredient usage, forecast |
| **Inventory** | Stock management, purchase orders, suppliers |
| **Testing** | 33 automated API smoke test scenarios |

---

## Project Structure

```
restaurant-pos/
├── pos-app/                 # Next.js dashboard + REST API backend
├── pos-mobile/              # Expo mobile app (Android & iOS)
├── docs/                    # RDP documents, checklists, PDF specs
│   └── screenshots/         # App screenshots
├── scripts/                 # Windows helper scripts (dev setup)
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web Dashboard | Next.js, TypeScript, React |
| Mobile App | Expo, React Native, TypeScript |
| Backend API | Next.js API Routes |
| ORM | Prisma |
| Database | MySQL 8 |
| Auth | JWT + PIN-based mobile login |

---

## Prerequisites

- **Node.js** 22 LTS (or 20+)
- **MySQL** 8.0+ (XAMPP / WAMP / MySQL Workbench / MariaDB 10+)
- **Android Studio** (optional, for mobile emulator)

---

## Setup

### 1. Create database

```sql
CREATE DATABASE pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure environment

**`pos-app/.env`**
```env
DATABASE_URL="mysql://root:PASSWORD@localhost:3306/pos_db"
```

**`pos-mobile/.env`**
```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3001
```

### 3. Install & migrate

```bash
cd pos-app
npm install
npx prisma migrate deploy
npm run db:seed
```

---

## Running

### Backend + Dashboard
```bash
cd pos-app
npm run dev
```
Open http://localhost:3001 → login `admin` / `password123`

### Mobile App (Android emulator)
```bash
cd pos-mobile
npm install
npm start
```
Press **a** in Expo CLI. Login: `kasir1` / PIN `1111`

### Windows quick start
```bash
scripts/1-JALANKAN-SERVER.bat
scripts/2-INSTALL-MOBILE-EMULATOR.bat
```

---

## Demo Accounts

| User | PIN | Platform |
|------|-----|----------|
| admin | 1234 | Dashboard |
| manager1 | 3333 | Dashboard |
| kasir1 | 1111 | Mobile (Outlet 1) |
| kasir2 | 5555 | Mobile (Outlet 2) |
| dapur1 | 2222 | Dashboard → Kitchen |
| inventory1 | 4444 | Dashboard → Inventory |

Dashboard password: `password123`

**QR Menu:** http://localhost:3001/qr/OUT1  
**Loyalty demo:** HP `081234567890`

---

## Testing

```bash
cd pos-app
npm run smoke-test
```
33 automated API scenarios.

Manual testing checklist: [`docs/RDP_CHECKLIST_MANUAL_TESTING.md`](docs/RDP_CHECKLIST_MANUAL_TESTING.md)

---

## Author

**Syarif Hidayatullah** — [GitHub](https://github.com/Syarif170318) · [Email](mailto:hidayatullahsrf@gmail.com)
