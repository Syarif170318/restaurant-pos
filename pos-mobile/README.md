# Restaurant POS Mobile — Android & iOS

App kasir/waiter untuk order & pembayaran. Connect ke backend `pos-app` (MySQL).

## Fitur

- Login PIN
- Buka / Tutup Shift kasir
- Dine-in & Takeaway
- Pilih meja, buat order, hold order
- Modifier picker (Extra Pedas, dll.)
- Konfirmasi ke Kitchen
- Daftar order aktif (auto-refresh)
- Pembayaran: Cash, Card, QRIS
- Split Bill, Loyalty redeem
- Void order, offline queue sync

## Setup

### 1. Jalankan backend (MySQL harus sudah jalan)
```bash
cd ../pos-app
npm run dev
```

### 2. API URL (edit `pos-mobile/.env`)

| Device | EXPO_PUBLIC_API_BASE_URL |
|--------|--------------------------|
| Android Emulator | `http://10.0.2.2:3001` |
| iOS Simulator | `http://localhost:3001` |
| HP fisik (WiFi sama) | `http://192.168.x.x:3001` |

Copy dari `.env.example` jika belum ada `.env`.

### 3. Jalankan app (pilih salah satu)

**Cara A — Expo Go (paling gampang, tanpa build Java):**
```bash
npm install
npm start
```
Tekan **a** → buka di emulator (perlu app **Expo Go** di emulator).

Atau langsung:
```bash
npm run android
```

**Cara B — Build native APK ke emulator (butuh Java):**
```bash
npm run android:build
```
Script ini otomatis set `JAVA_HOME` dari Android Studio.

Kalau error `JAVA_HOME`, jalankan manual di PowerShell:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
npm run android:build
```

## Login Demo

| Username | PIN |
|----------|-----|
| kasir1 | 1111 |
| kasir2 | 5555 |

## Flow Kasir

1. Login PIN
2. Buka Shift (modal awal)
3. Pilih meja / takeaway
4. Buat order → konfirmasi ke Kitchen
5. Bayar di Payment screen
6. Tutup Shift

## Build APK (Production)

```bash
npm install -g eas-cli
eas build --platform android --profile preview
```
