# Restaurant POS Dashboard + Backend API

**Dashboard web** + **Backend API** — database **MySQL 8+**.

## Arsitektur

```
pos-app (ini)          pos-mobile
Dashboard Web    ←→    Android/iOS App
+ Backend API          (Kasir/Waiter)
        │
        ▼
    MySQL (pos_db)
```

| Client | Platform | User |
|--------|----------|------|
| **Dashboard** | PC/Laptop browser | Admin, Manager, Inventory, Kitchen |
| **Mobile App** | Android/iOS | Kasir, Waiter |

## Setup MySQL

1. Buat database:
   ```sql
   CREATE DATABASE pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Edit `.env` (lihat `.env.example`):
   ```env
   DATABASE_URL="mysql://root:PASSWORD@localhost:3306/pos_db"
   JWT_SECRET="pos-mvp-secret-change-in-production"
   PORT=3001
   ```

3. Install & migrate:
   ```bash
   npm install
   npx prisma migrate deploy
   npm run db:seed
   npm run dev
   ```

Dashboard: http://localhost:3001

## Scripts

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Dev server port 3001 |
| `npm run build` | Production build |
| `npm run db:seed` | Isi data demo |
| `npm run db:migrate` | Buat migration baru (dev) |
| `npm run smoke-test` | Tes API otomatis (33 skenario) |

## Demo Accounts

| Username | PIN | Role |
|----------|-----|------|
| admin | 1234 | Admin |
| manager1 | 3333 | Manager |
| kasir1 | 1111 | Cashier |
| dapur1 | 2222 | Kitchen |
| inventory1 | 4444 | Inventory |

Password: `password123`

## Mobile App

Lihat `../pos-mobile/README.md`
