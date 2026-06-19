# 📦 Panduan Lengkap — Paket Pickup Tracker PWA

> Versi: 1.0 | Terakhir diperbarui: 19 Juni 2026

---

## Daftar Isi

**PART 1 — Instalasi & Fitur Utama**
1. [Apa itu Paket Pickup Tracker?](#1-apa-itu-paket-pickup-tracker)
2. [Instalasi PWA](#2-instalasi-pwa)
3. [Setup Awal (First-Time Setup)](#3-setup-awal)
4. [Manajemen Toko](#4-manajemen-toko)
5. [Manajemen Paket](#5-manajemen-paket)
6. [Dashboard](#6-dashboard)

**PART 2 — Fitur Lanjutan & Troubleshoot** *(file terpisah)*
7. Trip Planner & Mode Pickup
8. Barcode & Scanner
9. OCR & Bulk Input
10. Statistik & Laporan
11. Google Sheets Sync
12. Backup & Restore
13. Troubleshooting

---

## 1. Apa itu Paket Pickup Tracker?

**Paket Pickup Tracker** adalah Progressive Web App (PWA) untuk melacak dan mengelola pengambilan paket dari toko Indomaret. Aplikasi ini dirancang untuk pasangan suami-istri yang rutin menerima paket di beberapa toko Indomaret berbeda.

### Masalah yang Diselesaikan
- ❌ Informasi paket tersebar di banyak grup WhatsApp
- ❌ Lupa mengambil paket → paket diretur otomatis oleh Indomaret (H+7)
- ❌ Sulit tahu paket mana yang urgent
- ❌ Tidak ada catatan histori pickup

### Fitur Utama
| Fitur | Deskripsi |
|---|---|
| 📊 Dashboard | Ringkasan semua paket, filter, dan pencarian |
| 🏪 Manajemen Toko | Daftar toko Indomaret yang sering digunakan |
| 📦 Manajemen Paket | Input manual, OCR foto resi, atau paste bulk |
| 🛵 Trip Planner | Rencanakan rute pickup dengan kapasitas motor |
| 📷 Barcode Scanner | Scan barcode AWB saat pickup di toko |
| ⏰ Reminder Otomatis | Notifikasi paket yang mendekati deadline |
| ☁️ Google Sheets Sync | Sinkronisasi data antar HP (suami & istri) |
| 📈 Statistik | Laporan dan grafik performa pickup |
| 💾 Backup/Restore | Export/Import data JSON dan CSV |

### Cara Kerja Singkat

```
Istri input paket → Data tersimpan lokal + sync ke cloud
                                    ↓
Suami buka app → Lihat dashboard → Plan trip → Pickup paket
                                    ↓
                        Scan/tap "Diambil" → Status update otomatis
```

---

## 2. Instalasi PWA

PWA bisa diinstall di HP maupun laptop tanpa perlu app store.

### 2.1 Android (Chrome)

1. Buka URL aplikasi di **Google Chrome**
2. Tunggu beberapa detik, akan muncul banner **"Add to Home Screen"** di bagian bawah
3. Jika banner tidak muncul:
   - Tap ikon **⋮** (titik tiga) di kanan atas Chrome
   - Pilih **"Install app"** atau **"Add to Home screen"**
4. Ketik nama (default: "Paket Pickup Tracker") → tap **Add**
5. Ikon aplikasi akan muncul di home screen

### 2.2 iPhone/iPad (Safari)

1. Buka URL di **Safari** (HARUS Safari, bukan Chrome)
2. Tap ikon **Share** (kotak dengan panah ke atas) di toolbar bawah
3. Scroll ke bawah, pilih **"Add to Home Screen"**
4. Beri nama → tap **Add**

### 2.3 Desktop (Chrome/Edge)

1. Buka URL di browser
2. Klik ikon **Install** (⊕) di address bar, atau
3. Menu ⋮ → **"Install Paket Pickup Tracker"**

### 2.4 Verifikasi Instalasi

Setelah install, pastikan:
- [x] Aplikasi terbuka dalam mode standalone (tanpa address bar browser)
- [x] Ikon muncul di home screen / desktop
- [x] Bisa dibuka tanpa internet (mode offline)

> **💡 Tips:** Setelah install, buka aplikasi sekali saat masih online agar semua asset ter-cache untuk penggunaan offline.

---

## 3. Setup Awal

### Langkah 1: Buka Aplikasi
Buka aplikasi dari ikon di home screen. Anda akan melihat **Dashboard** kosong.

### Langkah 2: Izinkan Notifikasi
Saat pertama kali dibuka, browser akan meminta izin notifikasi. **Tap "Allow"** agar reminder deadline berfungsi.

### Langkah 3: Tambah Toko Indomaret
Sebelum input paket, Anda harus mendaftarkan toko Indomaret yang biasa digunakan.

1. Di Dashboard, tap tombol **"Kelola Toko"** (kanan atas)
2. Atau navigasi ke halaman toko lewat URL `#stores`
3. Tap **"+ Tambah"**
4. Isi form:
   - **Kode IDM**: Kode unik toko (misal: `T1AB`, `IDMXYZ`)
   - **Nama Toko**: Nama yang mudah dikenali (misal: `Indomaret Jl. Mawar`)
   - **Alamat**: Opsional, untuk referensi
5. Tap **Simpan**

### Langkah 4: (Opsional) Setup Sync
Jika ingin sharing data antar HP, lihat **Bagian 11: Google Sheets Sync** di Part 2.

---

## 4. Manajemen Toko

### 4.1 Menambah Toko

1. Navigasi ke **Kelola Toko** (dari Dashboard atau `#stores`)
2. Tap **"+ Tambah"**
3. Isi: Kode IDM, Nama Toko, Alamat
4. Tap **Simpan**

> ⚠️ Kode IDM harus unik. Sistem akan menolak jika ada duplikat.

### 4.2 Edit Toko

1. Di daftar toko, tap **"Edit"** pada toko yang ingin diubah
2. Ubah data yang diperlukan
3. Tap **Simpan**

### 4.3 Hapus Toko

1. Tap **"Hapus"** pada toko target
2. Konfirmasi penghapusan

> ⚠️ Menghapus toko TIDAK menghapus paket terkait, tapi paket akan kehilangan referensi nama toko (tampil sebagai "Toko Tidak Diketahui").

### 4.4 Info Toko

Setiap kartu toko menampilkan:
- Nama dan kode toko
- Alamat (jika diisi)
- Jumlah **paket aktif** (pending) di toko tersebut

---

## 5. Manajemen Paket

### 5.1 Input Manual

1. Tap tab **"Tambah"** di navigasi bawah (atau tombol **+** di Dashboard)
2. Pastikan tab **"Manual"** aktif
3. Isi form:

| Field | Wajib? | Keterangan |
|---|---|---|
| Toko Indomaret | ✅ Ya | Pilih dari dropdown |
| Nama Penerima | ✅ Ya | Nama sesuai di paket |
| Nomor AWB/Resi | ❌ Tidak | Misal: IDP123456789 |
| Kode PIN | ✅ Ya | PIN 6 digit untuk pickup |
| Invoice | ❌ Tidak | Nomor invoice belanja |
| Tanggal Masuk | ✅ Ya | Default: hari ini |
| Deadline | ✅ Ya | Auto H+7 dari tanggal masuk |
| Urgent | ❌ Tidak | Toggle on jika mendesak |
| Catatan | ❌ Tidak | Info tambahan |

4. Tap **"Simpan Paket"**

> **💡 Tips:** Deadline otomatis dihitung H+7 dari tanggal masuk. Anda bisa mengubahnya manual jika perlu.

### 5.2 Edit Paket

1. Dari Dashboard, tap kartu paket untuk masuk ke **Detail Paket**
2. Tap **"Edit"**
3. Ubah data yang diperlukan
4. Tap **"Update"**

### 5.3 Hapus Paket

1. Dari halaman Detail Paket
2. Tap **"Hapus"** (tombol merah)
3. Konfirmasi penghapusan

### 5.4 Tandai Sudah Diambil

Ada 2 cara:
- **Dari Detail Paket**: Tap tombol hijau **"Tandai Sudah Diambil"**
- **Dari Mode Pickup**: Tap **"Diambil"** pada kartu paket (lihat Bagian 7)

### 5.5 Status Paket

| Status | Warna | Deskripsi |
|---|---|---|
| `aman` | 🟡 Kuning | Deadline masih > 3 hari |
| `segera` | 🟡 Kuning | Deadline 2-3 hari lagi |
| `besok` | 🔴 Merah | Deadline besok |
| `hari-ini` | 🔴 Merah | Deadline hari ini |
| `terlambat` | 🔴 Merah | Sudah lewat deadline |
| `picked_up` | 🟢 Hijau | Sudah diambil |
| `returned` | 🔴 Merah | Diretur (otomatis saat expired) |

### 5.6 Sistem Reminder Otomatis

Aplikasi secara otomatis memeriksa deadline setiap 1 jam:

| Kondisi | Aksi |
|---|---|
| H-3 atau H-2 | ⚠️ Notifikasi peringatan |
| H-1 (besok) | 🚨 Notifikasi URGENT |
| H-0 (hari ini) | 🚨 Notifikasi URGENT |
| Lewat deadline | Auto-mark sebagai **returned** + notifikasi |

---

## 6. Dashboard

Dashboard adalah halaman utama yang menampilkan ringkasan semua paket.

### 6.1 Komponen Dashboard

1. **Alert Banner**: Muncul jika ada paket urgent atau retur hari ini
2. **Summary Cards**: 3 kartu ringkasan (Total, Pending, Urgent)
3. **Search Bar**: Cari paket berdasarkan Nama, AWB, atau PIN
4. **Filter Tabs**: Semua, Pending, Urgent, Diambil, Retur
5. **Daftar Paket**: Dikelompokkan per toko, dengan info PIN & barcode
6. **FAB (+)**: Tombol floating untuk tambah paket baru

### 6.2 Pencarian

Ketik di search bar untuk mencari berdasarkan:
- Nama penerima
- Nomor AWB/Resi
- Kode PIN

Pencarian bersifat real-time dengan debounce 300ms.

### 6.3 Filter

| Tab | Menampilkan |
|---|---|
| Semua | Seluruh paket tanpa filter |
| Pending | Paket yang belum diambil (sorted by deadline) |
| Urgent | Paket pending dengan deadline ≤ 1 hari |
| Diambil | Paket yang sudah di-pickup |
| Retur | Paket yang diretur/expired |

### 6.4 Kartu Paket

Setiap kartu paket menampilkan:
- Nama penerima
- Badge status (warna sesuai urgency)
- Nomor AWB
- Kode PIN (bold)
- Barcode AWB (mini)
- Tanggal deadline (untuk paket pending)

Tap kartu untuk masuk ke halaman **Detail Paket**.
