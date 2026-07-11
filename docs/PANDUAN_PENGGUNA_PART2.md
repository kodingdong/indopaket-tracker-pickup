# 📦 Panduan Lengkap — Paket Pickup Tracker PWA (PART 2)

> Fitur Lanjutan, Sync, dan Troubleshooting

---

## Daftar Isi

7. [Trip Planner & Mode Pickup](#7-trip-planner--mode-pickup)
   - 7.1 Apa itu Trip?
   - 7.2 Membuat Trip
   - 7.3 Mode Pickup
8. [Barcode & Scanner](#8-barcode--scanner)
   - 8.1 Barcode Otomatis
   - 8.2 Scanner Kamera
9. [OCR & Bulk Input](#9-ocr--bulk-input)
   - 9.1 Upload OCR (Scan Foto Resi)
   - 9.2 Paste Bulk (dari Excel/Spreadsheet)
10. [Statistik & Laporan](#10-statistik--laporan)
    - 10.1 Metrik yang Ditampilkan
    - 10.2 Visualisasi
    - 10.3 Backup dari Halaman Statistik
11. [Google Sheets Sync (Cloud Sync)](#11-google-sheets-sync-cloud-sync)
    - 11.1 Arsitektur
    - 11.2 Setup Google Sheets (Satu Kali)
    - 11.3 Cara Sync
    - 11.4 Indikator Sync
    - 11.5 Force Push & Force Pull
    - 11.6 Sync Log
12. [Backup & Restore](#12-backup--restore)
    - 12.1 Dari Halaman Pengaturan
    - 12.2 Export JSON
    - 12.3 Import JSON
    - 12.4 Format CSV Export
    - 12.5 Danger Zone
13. [Troubleshooting](#13-troubleshooting)
    - 13.1 Instalasi & PWA
    - 13.2 Data & LocalStorage
    - 13.3 Google Sheets Sync
    - 13.4 Barcode & Scanner
    - 13.5 OCR
    - 13.6 Notifikasi & Reminder
    - 13.7 Performa & Umum
14. [Tips & Best Practices](#14-tips--best-practices)
15. [FAQ](#15-faq)

---

## 7. Trip Planner & Mode Pickup

### 7.1 Apa itu Trip?

**Trip** adalah sesi pengambilan paket. Fitur ini membantu merencanakan paket mana yang akan diambil dalam satu perjalanan, dengan mempertimbangkan kapasitas motor.

### 7.2 Membuat Trip

1. Tap **"Trip"** di navigasi bawah
2. Atur **Kapasitas Motor** (default: 5 paket)
3. Pilih paket yang akan diambil:
   - Paket **urgent otomatis terpilih** saat pertama kali render
   - Centang/uncheck paket individual
   - Gunakan **"Pilih Semua"** per toko untuk memilih seluruh paket di satu toko
4. Counter menunjukkan `Selected: X/Y` (terpilih/kapasitas)
5. Tap **"Mulai Trip Sekarang"**

> **💡 Tips:** Paket dikelompokkan per toko. Prioritaskan toko dengan paket urgent terbanyak.

### 7.3 Mode Pickup

Setelah trip dimulai, Anda masuk ke **Mode Pickup**:

#### Tampilan
- **Progress bar** di atas menunjukkan berapa paket sudah diambil
- Paket dikelompokkan per toko
- Setiap kartu paket menampilkan: **PIN besar**, AWB, dan **barcode**

#### Aksi per Paket

| Tombol | Fungsi |
|---|---|
| **Diambil** | Tandai paket sudah di-pickup (status → `picked_up`) |
| **Skip** | Lewati paket (tetap pending, hanya visual) |
| **Batal (Undo)** | Batalkan status "Diambil" kembali ke pending |

#### Barcode Scanner

1. Tap **"📷 Scan"** di kanan atas
2. Arahkan kamera ke barcode AWB pada paket
3. Jika AWB cocok → otomatis tandai "Diambil"
4. Jika tidak cocok → muncul pesan error
5. Tap **"Tutup Scanner"**, ketuk tombol **✕** (silang) di pojok kanan atas, atau **swipe ke atas** (geser ke atas) pada area kamera untuk menutup scanner.

#### Menyelesaikan Trip

- Tap **"Akhiri Trip"** (atau **"Selesai ✓"** jika semua sudah diambil)
- Trip disimpan ke histori
- Kembali ke Dashboard

> **⚠️ Penting:** Haptic feedback (getaran) aktif saat menandai paket jika device mendukung `navigator.vibrate`.

---

## 8. Barcode & Scanner

### 8.1 Barcode Otomatis

Setiap paket yang memiliki **Nomor AWB** akan otomatis di-generate barcode-nya (format CODE128). Barcode ditampilkan di:
- Dashboard (mini barcode)
- Detail Paket
- Mode Pickup (barcode lebih besar)

### 8.2 Scanner Kamera

Scanner menggunakan kamera belakang HP untuk membaca barcode. Tersedia di **Mode Pickup**.

**Cara Pakai:**
1. Masuk ke Mode Pickup (mulai trip dulu)
2. Tap **"📷 Scan"**
3. Izinkan akses kamera jika diminta
4. Arahkan kamera ke barcode → scan otomatis
5. Jika AWB ditemukan di trip → paket otomatis ditandai "Diambil"
6. Feedback: suara beep + getaran

**Konfigurasi Scanner:**
- FPS: 10 frame per detik
- Area scan: 250×100 pixel (rectangle)
- Kamera: facing environment (belakang)

---

## 9. OCR & Bulk Input

### 9.1 Upload OCR (Scan Foto Resi)

Fitur ini menggunakan **Tesseract.js** untuk mengekstrak teks dari foto/screenshot resi paket.

**Langkah:**
1. Tap **"Tambah"** di navigasi bawah. Tab **"Upload OCR"** akan terbuka secara default.
2. Pilih **Toko Indomaret** dari dropdown
3. Pilih gambar:
   - Tap area upload untuk memilih file, atau
   - Drag & drop gambar ke area upload
   - Bisa pilih **banyak gambar sekaligus**
4. Preview gambar muncul di bawah area upload
5. Tap **"Proses OCR"**
6. Tunggu proses (progress bar menunjukkan status)
7. Hasil ekstraksi masuk ke **halaman Review**

**Halaman Review:**
- Tabel dengan kolom: Nama, AWB, PIN, Urgent
- Semua field bisa **diedit manual** jika hasil OCR kurang akurat
- Tap **"Hapus"** untuk buang baris yang salah
- Tap **"Simpan Semua"** untuk menyimpan

**Data yang Diekstrak OCR:**
| Data | Pola Deteksi |
|---|---|
| AWB | Regex: `IDP\d+` (awalan IDP diikuti angka) |
| PIN | Regex: `\b\d{6}\b` (6 digit angka) |
| Nama | Baris teks pertama tanpa angka dan tanpa "IDP" |

> **⚠️ Keterbatasan OCR:** Akurasi tergantung kualitas foto. Foto gelap, blur, atau tulisan kecil bisa menghasilkan hasil kurang akurat. **Selalu review sebelum simpan!**

### 9.2 Paste Bulk (dari Excel/Spreadsheet)

Untuk input banyak paket sekaligus dari spreadsheet.

**Langkah:**
1. Tap **"Tambah"** → pilih tab **"Paste Bulk"**
2. Pilih **Toko Indomaret**
3. Copy data dari Excel/Spreadsheet
4. Paste ke textarea

**Format Data (dipisahkan Tab):**
```
Nama[TAB]AWB[TAB]PIN
```

**Contoh:**
```
Budi    IDP123456789    112233
Siti    IDP987654321    445566
Ahmad   IDP555666777    778899
```

5. Tap **"Review Data"**
6. Periksa dan edit di halaman Review
7. Tap **"Simpan Semua"**

> **💡 Tips:** Jika hanya punya Nama dan PIN (tanpa AWB), cukup 2 kolom: `Nama[TAB]PIN`

---

## 10. Statistik & Laporan

Navigasi ke tab **"Statistik"** di navigasi bawah.

### 10.1 Metrik yang Ditampilkan

| Metrik | Deskripsi |
|---|---|
| Total Paket | Jumlah seluruh paket (semua status) |
| Sudah Diambil | Persentase dan jumlah paket picked_up |
| Pending | Jumlah paket yang belum diambil |
| Retur/Expired | Jumlah paket yang diretur |
| Rata-rata Waktu Pickup | Berapa hari rata-rata dari masuk hingga diambil |

### 10.2 Visualisasi

- **Pie Chart (Conic Gradient):** Distribusi status paket (Pending vs Diambil vs Retur)
- **Bar Chart:** Jumlah paket per toko Indomaret (sorted descending)

### 10.3 Backup dari Halaman Statistik

Di bagian bawah halaman Statistik juga tersedia tombol **Export** dan **Import** JSON.

---

## 11. Google Sheets Sync (Cloud Sync)

### 11.1 Arsitektur

```
HP Istri (Input)  ←→  Google Sheets (Cloud)  ←→  HP Suami (Picker)
     PWA                  Apps Script API              PWA
```

Data disinkronisasi via **Google Apps Script** yang berfungsi sebagai REST API, dengan **Google Sheets** sebagai database cloud.

### 11.2 Setup Google Sheets (Satu Kali)

#### Langkah 1: Buat Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru, beri nama: **"Paket Pickup Tracker DB"**
3. Buat 4 sheet tab dengan nama **PERSIS** berikut:

**Tab `stores`** — Header baris pertama:
```
id | kode_toko | nama_toko | alamat | created_at | updated_at | _deleted | _synced | _last_modified_by
```

**Tab `packages`** — Header baris pertama:
```
id | store_id | nama | nomor_awb | pin | invoice | tanggal_masuk | deadline | urgent | catatan | status | tanggal_pickup | barcode_data | created_at | updated_at | _deleted | _synced | _last_modified_by
```

**Tab `trips`** — Header baris pertama:
```
id | packages | status | completed_at | created_at | updated_at | _deleted | _synced | _last_modified_by
```

**Tab `devices`** — Header baris pertama:
```
device_id | device_name | role | last_seen
```

> ⚠️ Nama tab dan header harus **lowercase** dan **persis** seperti di atas. Pisahkan tiap header ke kolom berbeda.

#### Langkah 2: Deploy Google Apps Script

1. Di spreadsheet, buka menu **Extensions → Apps Script**
2. Hapus kode default di `Code.gs`
3. Copy-paste seluruh isi file `gas/Code.gs` dari project ini
4. Simpan (Ctrl+S), beri nama project: "Paket Tracker API"
5. Klik **Deploy → New deployment**
6. Klik ⚙️ di samping "Select type" → pilih **Web app**
7. Isi:
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Klik **Deploy**
9. **Copy URL** yang muncul (format: `https://script.google.com/macros/s/.../exec`)

#### Langkah 3: Konfigurasi di Aplikasi

1. Buka app → navigasi ke **⚙️ Pengaturan**
2. Di bagian **Info Device**:
   - Nama Device: misal `HP Istri` atau `HP Suami`
   - Role: pilih `📥 Input (Istri)` atau `🛵 Picker (Suami)`
3. Di bagian **Google Sheets Sync**:
   - Paste URL Apps Script ke field **Apps Script URL**
   - Tap **"🔗 Test Koneksi"** → harus muncul ✅
4. Pilih **Sync Mode**:
   - 🔴 Off: Tidak sync
   - 🟡 Manual: Sync saat ditekan tombol
   - 🟢 Auto: Sync otomatis (interval bisa diatur: 5/10/15/30 menit)
5. Tap **"💾 Simpan Konfigurasi"**

> **Ulangi langkah 3 di HP kedua** dengan URL yang sama tapi nama device dan role berbeda.

### 11.3 Cara Sync

| Mode | Cara |
|---|---|
| Manual | Buka ⚙️ Pengaturan → tap **"🔄 Sync Sekarang"** |
| Auto | Otomatis setiap X menit (dan saat kembali online) |

### 11.4 Indikator Sync

Icon ☁️ di header kanan atas menunjukkan status:
| Tampilan | Status |
|---|---|
| Abu-abu | Sync belum dikonfigurasi / OFF |
| Berputar | Sedang syncing |
| Merah | Offline |
| Hijau | Synced (hover untuk lihat waktu terakhir) |

### 11.5 Force Push & Force Pull

Di halaman Pengaturan, bagian **Sync Actions**:

| Aksi | Fungsi | ⚠️ Peringatan |
|---|---|---|
| **⬆️ Force Push** | Timpa SEMUA data cloud dengan data lokal | Data cloud akan dihapus |
| **⬇️ Force Pull** | Timpa SEMUA data lokal dengan data cloud | Data lokal akan dihapus |

Kedua aksi memerlukan **2x konfirmasi** untuk mencegah kesalahan.

### 11.6 Sync Log

Di bagian **📋 Sync Log**, Anda bisa melihat histori 20 sync terakhir:
- ✅ Sync berhasil (dengan jumlah data pulled/pushed)
- ❌ Sync gagal (dengan pesan error)
- 📌 Force push/pull

---

## 12. Backup & Restore

### 12.1 Dari Halaman Pengaturan

Di bagian **💾 Data Management**:

| Aksi | Format | Keterangan |
|---|---|---|
| 📤 Export JSON | `.json` | Backup lengkap (stores + packages + trips) |
| 📤 Export CSV | `.csv` | Hanya data paket (untuk dibuka di Excel) |
| 📥 Import JSON | `.json` | Restore dari file backup JSON |
| 📥 Import CSV | `.csv` | Import paket dari file CSV |

### 12.2 Export JSON

1. Buka ⚙️ Pengaturan
2. Tap **"📤 Export JSON"**
3. File `paket_backup_[timestamp].json` akan terdownload

### 12.3 Import JSON

1. Tap **"📥 Import JSON"**
2. Pilih file `.json` backup
3. Konfirmasi — data saat ini akan **ditimpa**

### 12.4 Format CSV Export

```csv
Nama,AWB,PIN,Toko,Status,Tanggal Masuk,Deadline,Urgent
"Budi","IDP123","112233","T1AB","pending","2026-06-19","2026-06-26","Tidak"
```

### 12.5 Danger Zone

| Aksi | Fungsi |
|---|---|
| 🗑️ Hapus Semua Data Lokal | Menghapus stores, packages, trips dari localStorage |
| 🗑️ Hapus Semua Data Cloud | Mengosongkan data di Google Sheets |

> **⚠️ PERINGATAN:** Kedua aksi **tidak bisa dibatalkan**! Pastikan sudah export backup.

---

## 13. Troubleshooting

### 13.1 Instalasi & PWA

| Masalah | Solusi |
|---|---|
| Tombol "Install" tidak muncul di Chrome | Pastikan URL menggunakan HTTPS. Buka chrome://flags dan pastikan PWA install prompt diaktifkan. Coba hapus cache browser. |
| Aplikasi tidak bisa dibuka offline | Buka aplikasi sekali saat online, tunggu semua asset ter-cache. Periksa service worker di DevTools → Application → Service Workers. |
| Tampilan tidak update setelah deploy baru | Service worker menggunakan cache-first. Buka DevTools → Application → Service Workers → klik "Update" atau "Unregister", lalu refresh. |
| Ikon tidak muncul di home screen | Pastikan folder `icons/` berisi file `icon-192x192.png` dan `icon-512x512.png`. |
| Aplikasi terputar (Landscape) | Sejak v1.2.5, aplikasi dikunci ke mode **Portrait** melalui manifest. Jika masih terputar, pastikan auto-rotate HP Anda nonaktif atau refresh PWA Anda. |

### 13.2 Data & LocalStorage

| Masalah | Solusi |
|---|---|
| Data hilang setelah clear browser | Data disimpan di localStorage. Jika browser data di-clear, data hilang. **Selalu backup via Export JSON secara berkala!** |
| Storage penuh (QuotaExceededError) | localStorage biasanya 5-10MB. Export lalu hapus data lama (paket yang sudah picked_up/returned). |
| Data tidak muncul setelah import | Pastikan format file JSON sesuai (harus ada key `stores` dan `packages`). Refresh halaman setelah import. |
| Paket otomatis jadi "Retur" | Ini perilaku normal. Paket yang melewati deadline otomatis ditandai returned oleh sistem reminder. |

### 13.3 Google Sheets Sync

| Masalah | Solusi |
|---|---|
| Test koneksi gagal | 1. Pastikan URL benar (harus diakhiri `/exec`) 2. Pastikan deployment berstatus "Active" 3. Coba akses URL + `?action=ping` di browser |
| Error "Server busy" (429) | Apps Script sedang digunakan device lain. Tunggu beberapa detik, coba lagi. |
| Sync berhasil tapi data tidak muncul | Periksa nama tab di spreadsheet (harus lowercase: `stores`, `packages`, `trips`). Periksa header kolom. |
| Data duplikat setelah sync | Kemungkinan ID conflict. Gunakan **Force Push** dari device yang datanya benar, lalu **Force Pull** di device lain. |
| Error "Sheet not found" | Tab dengan nama yang diminta tidak ada di spreadsheet. Buat tab yang hilang dengan header yang benar. |
| CORS error saat sync | Pastikan deployment Apps Script diset "Who has access: **Anyone**". Redeploy jika perlu. |
| Sync lambat | Google Apps Script punya limit execution time. Jika data besar (>1000 paket), sync bisa lambat. Pertimbangkan cleanup data lama. |

### 13.4 Barcode & Scanner

| Masalah | Solusi |
|---|---|
| Barcode tidak muncul | Pastikan field **Nomor AWB** terisi. Barcode hanya digenerate jika AWB ada. Periksa apakah library JsBarcode termuat (lihat console). |
| Scanner kamera tidak bisa dibuka | 1. Izinkan akses kamera di browser settings 2. Pastikan URL menggunakan HTTPS (kamera butuh secure context) 3. Pastikan tidak ada aplikasi lain yang menggunakan kamera |
| Scanner tidak mendeteksi barcode | 1. Pastikan pencahayaan cukup 2. Arahkan barcode ke area kotak scan 3. Jaga jarak ±10-15cm dari barcode 4. Pastikan barcode tidak terlipat/rusak |
| Error "Library Scanner belum siap" | Library html5-qrcode belum termuat. Periksa koneksi internet (library dimuat dari CDN). |

### 13.5 OCR

| Masalah | Solusi |
|---|---|
| OCR tidak mendeteksi teks | 1. Pastikan foto jelas dan terang 2. Crop foto agar fokus ke area resi 3. Gunakan resolusi minimal 720p |
| Hasil OCR tidak akurat | Ini wajar — selalu review dan edit hasil di halaman Review sebelum simpan. OCR lebih akurat untuk teks cetak daripada tulisan tangan. |
| Error "Library Tesseract belum dimuat" | Tesseract.js dimuat dari CDN. Pastikan koneksi internet aktif saat proses OCR. |
| OCR sangat lambat | Tesseract.js proses di browser (client-side). Foto besar akan lebih lambat. Kompres/crop foto sebelum upload. |

### 13.6 Notifikasi & Reminder

| Masalah | Solusi |
|---|---|
| Notifikasi tidak muncul | 1. Periksa izin notifikasi: Settings browser → Site Settings → Notifications 2. Pastikan "Allow" untuk URL aplikasi 3. Di iOS, notifikasi PWA terbatas |
| Notifikasi muncul terlalu sering | Notifikasi hanya dikirim 1x per hari per paket per level (warning/urgent/returned). History disimpan di `paket_notified_history`. |
| Reminder tidak menandai paket expired | Reminder berjalan setiap 1 jam. Jika app tidak dibuka, reminder tidak jalan. Buka app minimal 1x sehari. |

### 13.7 Performa & Umum

| Masalah | Solusi |
|---|---|
| Aplikasi lambat | Terlalu banyak data di localStorage. Export backup, lalu hapus paket lama via Danger Zone. |
| Tampilan rusak / CSS tidak termuat | Clear cache browser, atau unregister service worker lalu refresh. |
| Halaman blank / putih | Buka DevTools (F12) → Console, periksa error JavaScript. Biasanya karena library CDN gagal dimuat. |
| Toast/notif tidak muncul di UI | Elemen `#toast-container` mungkin tertutup elemen lain. Periksa z-index. |

---

## 14. Tips & Best Practices

### Untuk Istri (Role: Input)
1. **Input paket segera** setelah dapat notifikasi dari kurir/Indomaret
2. Gunakan **OCR** jika punya screenshot resi — lebih cepat dari manual
3. Pastikan **PIN** benar — ini yang paling penting untuk pickup
4. Set **urgent** untuk paket yang harus segera diambil (obat, makanan, dll)

### Untuk Suami (Role: Picker)
1. Cek **Dashboard** sebelum berangkat — perhatikan alert urgent
2. Gunakan **Trip Planner** untuk efisiensi rute
3. Di toko, gunakan **Mode Pickup** — PIN besar mudah dibaca
4. Manfaatkan **Barcode Scanner** untuk marking cepat
5. **Akhiri Trip** setelah selesai agar histori tercatat

### Backup Rutin
1. Export JSON **minimal 1x seminggu**
2. Simpan file backup di Google Drive / cloud storage lain
3. Jika menggunakan sync, data sudah ada di Google Sheets sebagai backup

### Maintenance
1. Hapus data paket lama (sudah picked_up > 30 hari) secara berkala
2. Update service worker jika ada versi baru (unregister + refresh)
3. Periksa sync log berkala untuk memastikan tidak ada error

---

## 15. FAQ

**Q: Apakah data aman?**
A: Data tersimpan di localStorage browser Anda (lokal). Jika sync aktif, data juga ada di Google Sheets Anda. Tidak ada server pihak ketiga yang menyimpan data.

**Q: Bisa diakses dari banyak HP?**
A: Ya, dengan mengaktifkan Google Sheets Sync. Kedua HP harus dikonfigurasi dengan URL Apps Script yang sama.

**Q: Bisa dipakai offline?**
A: Ya! Semua fitur utama (input, view, pickup) berjalan offline. Hanya fitur sync dan OCR yang butuh internet.

**Q: Berapa batas data yang bisa disimpan?**
A: localStorage biasanya 5-10MB. Cukup untuk ribuan paket. Jika mendekati limit, export dan bersihkan data lama.

**Q: Apakah bisa dipakai untuk bisnis (banyak kurir)?**
A: Aplikasi ini didesain untuk penggunaan personal (2 user). Untuk bisnis, perlu modifikasi arsitektur.

---

*Dokumen ini di-generate berdasarkan source code aplikasi. Untuk pertanyaan lebih lanjut, lihat file README.md atau buka issue di repository GitHub.*
