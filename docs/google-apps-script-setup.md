# 📋 Google Apps Script Setup Guide — IndoPaket Tracker Cloud Sync

Panduan lengkap untuk setup Google Sheets sebagai cloud database untuk IndoPaket Tracker.

---

## Prerequisites

- Akun Google (untuk Google Sheets & Apps Script)
- Browser modern (Chrome recommended)
- IndoPaket Tracker sudah running (local atau GitHub Pages)

---

## Step 1: Buat Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik **"+ Blank"** untuk buat spreadsheet baru
3. Rename spreadsheet menjadi **"IndoPaket Data"** (klik judul di kiri atas)

---

## Step 2: Buat Sheet Tabs

Buat **5 sheet tabs** dengan cara klik **"+"** di bagian bawah spreadsheet.
Rename setiap tab sesuai nama berikut (klik kanan tab → Rename):

### Tab 1: `stores`
Ketik headers ini di **Row 1**:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| id | kode_toko | nama_toko | alamat | created_at | updated_at | _deleted |

### Tab 2: `packages`
Ketik headers ini di **Row 1**:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| id | store_id | nama | nomor_awb | pin | invoice | status | is_urgent | tanggal_masuk | deadline | tanggal_pickup | catatan | created_at | updated_at | _deleted | _last_modified_by |

### Tab 3: `trips`
Ketik headers ini di **Row 1**:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| id | tanggal | status | package_ids | completed_at | created_at | updated_at |

### Tab 4: `sync_meta`
Ketik headers ini di **Row 1**:

| A | B |
|---|---|
| key | value |

Tambahkan row data:

| key | value |
|-----|-------|
| version | 1 |

### Tab 5: `devices`
Ketik headers ini di **Row 1**:

| A | B | C | D |
|---|---|---|---|
| device_id | device_name | role | last_seen |

---

## Step 3: Setup Apps Script

1. Di spreadsheet, klik menu **Extensions → Apps Script**
2. Editor Apps Script akan terbuka di tab baru
3. **Hapus** semua kode default di `Code.gs`
4. **Copy-paste** seluruh isi file [`gas/Code.gs`](../gas/Code.gs) dari repository
5. Klik **💾 Save** (Ctrl+S)

---

## Step 4: Setup onEdit Trigger

Trigger ini diperlukan agar saat istri edit data langsung di Google Sheets, timestamp `updated_at` otomatis terupdate.

1. Di Apps Script Editor, klik **⏰ Triggers** (icon jam di sidebar kiri)
2. Klik **"+ Add Trigger"** (kanan bawah)
3. Isi konfigurasi:
   - **Choose which function to run**: `onEdit`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: `From spreadsheet`
   - **Select event type**: `On edit`
4. Klik **Save**
5. Jika diminta permission, klik **Allow**

---

## Step 5: Deploy sebagai Web App

1. Di Apps Script Editor, klik **Deploy → New deployment**
2. Klik **⚙️ icon** di sebelah "Select type" → pilih **Web app**
3. Isi konfigurasi:
   - **Description**: `IndoPaket API v1`
   - **Execute as**: `Me` (akun Google Anda)
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. Klik **Authorize access** jika diminta
   - Pilih akun Google Anda
   - Jika muncul "Google hasn't verified this app", klik **Advanced → Go to IndoPaket (unsafe)**
   - Klik **Allow**
6. **Copy URL** yang muncul → simpan URL ini!

> ⚠️ **PENTING**: URL akan terlihat seperti:
> `https://script.google.com/macros/s/AKfycbx.../exec`
> 
> Simpan URL ini — akan dipaste di Settings IndoPaket Tracker.

---

## Step 6: Test API

Buka URL berikut di browser (ganti dengan URL deployment Anda):

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=ping
```

Jika berhasil, Anda akan melihat response JSON:

```json
{"status":"ok","timestamp":"2026-06-16T14:30:00.000Z","version":1}
```

---

## Step 7: Share Spreadsheet ke Istri

Agar istri bisa buka dan edit Google Sheets langsung:

1. Buka spreadsheet "IndoPaket Data"
2. Klik **Share** (tombol biru kanan atas)
3. Masukkan **email Google istri**
4. Pilih permission: **Editor**
5. Klik **Send**

> 💡 Sekarang istri bisa:
> - Edit data langsung di Google Sheets (updated_at otomatis terupdate)
> - Buka IndoPaket Tracker di HP dan sync dari cloud

---

## Step 8: Konfigurasi di IndoPaket Tracker App

Lakukan di **KEDUA HP** (istri & suami):

1. Buka IndoPaket Tracker di browser HP
2. Klik **⚙️ icon** (gear) di header → masuk ke Settings
3. Paste **Apps Script URL** yang sudah dicopy di Step 5
4. Klik **"🔗 Test Koneksi"** — harus muncul "✅ Terhubung"
5. Isi **Device Name** (contoh: "HP Istri" atau "HP Suami")
6. Pilih **Role**: 
   - HP Istri → `Input`
   - HP Suami → `Picker`
7. Pilih **Sync Mode**:
   - `Manual` = tekan tombol sync manual
   - `Auto` = sync otomatis setiap N menit
   - `Off` = tidak sync (default)
8. Klik **"💾 Simpan Konfigurasi"**

---

## Troubleshooting

### ❌ "Script function not found"
→ Pastikan kode sudah di-save di Apps Script Editor

### ❌ "Authorization required"  
→ Klik Deploy → Test deployments → jalankan `doGet` sekali untuk trigger auth

### ❌ "Anyone" access tidak muncul
→ Pastikan akun Google bukan akun Workspace yang di-restrict admin

### ❌ Data tidak muncul setelah sync
→ Cek apakah header row di setiap sheet tab sudah benar (case-sensitive!)

### ❌ onEdit trigger tidak jalan
→ Pastikan trigger sudah ditambahkan di Step 4 (Triggers → Add Trigger)

### ⚠️ Setelah update kode Apps Script
→ Harus buat **New deployment** lagi (Deploy → New deployment)
→ URL deployment BERUBAH — harus update di Settings app di kedua HP

---

## Update Apps Script di Kemudian Hari

Jika perlu update kode `Code.gs`:

1. Buka Apps Script Editor
2. Update kode
3. Klik **Deploy → New deployment** (BUKAN "Manage deployments")
4. Deploy ulang sebagai Web app
5. Copy URL baru
6. Update URL di Settings IndoPaket Tracker **di kedua HP**

> 💡 **Tip**: Gunakan "Manage deployments" → edit existing deployment jika ingin keep URL yang sama. Tapi untuk perubahan besar, lebih aman buat deployment baru.
