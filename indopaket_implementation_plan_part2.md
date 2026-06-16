# 📦 IndoPaket Tracker — Implementation Plan (Opsi A) Part 2

> Tasks 6-12: Reminder, Trip Planner, Pickup Mode, Barcode/OCR, Stats & PWA
> 
> 🔀 **GitHub workflow global** → lihat [Part 1](./indopaket_implementation_plan_part1.md) untuk aturan branching, commit convention, PR template, dan issue tracking.

---

## TASK 6: Sistem Reminder & Deadline

### Tujuan
Notifikasi browser untuk paket mendekati deadline + auto-mark retur.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 6] Sistem Reminder & Deadline"
#    Labels: enhancement, priority:high, phase:2-advanced
#    Milestone: Phase 2 - Advanced Features

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-6-reminder

# 3. Commit secara atomic:
git add js/reminder.js
git commit -m "feat(reminder): add deadline checking logic with urgency levels"

git add js/reminder.js
git commit -m "feat(reminder): add browser notification with toast fallback"

git add js/reminder.js
git commit -m "feat(reminder): add daily summary and auto-mark expired"

git add js/app.js
git commit -m "feat(reminder): integrate Reminder.init() in app startup"

# 4. Push & PR
git push origin feature/task-6-reminder
# PR: "feat(reminder): Task 6 - Sistem Reminder & Deadline"
# Target: develop | Closes #6
```

### File: `js/reminder.js`

```javascript
const Reminder = {
  init() {
    // Request notification permission
    // Set interval setiap 1 jam untuk cek deadline
    // Cek deadline saat app pertama dibuka
  },

  checkDeadlines() {
    // Loop semua pending packages:
    // - daysLeft <= 0: auto-mark returned, notify "❌ Paket [nama] expired"
    // - daysLeft === 1: notify "🔴 URGENT: Paket [nama] deadline BESOK!"
    // - daysLeft === 3: notify "🟡 Paket [nama] deadline 3 hari lagi"
  },

  sendNotification(title, body) {
    // Browser Notification API
    // Fallback: showToast jika permission denied
  },

  getDailySummary() {
    // Return string: "Hari ini: X paket pending, Y urgent, Z deadline besok"
  }
};
```

### Edit: `js/app.js`
- Panggil `Reminder.init()` di `App.init()`

### Acceptance Criteria
- [ ] Request notification permission saat pertama buka
- [ ] Paket H-3 → warning notification
- [ ] Paket H-1 → urgent notification
- [ ] Paket H-0 (expired) → auto-mark returned
- [ ] Daily summary tampil di dashboard alert bar
- [ ] Fallback ke toast jika notification permission denied
- [ ] ✅ Branch `feature/task-6-reminder` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #6

---

## TASK 7: Trip Planner

### Tujuan
Suami bisa plan trip pickup — pilih paket berdasarkan kapasitas motor.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 7] Trip Planner"
#    Labels: enhancement, priority:high, phase:2-advanced
#    Milestone: Phase 2 - Advanced Features

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-7-trip-planner

# 3. Commit secara atomic:
git add js/trip.js
git commit -m "feat(trip): add trip planner UI with capacity input"

git add js/trip.js
git commit -m "feat(trip): add package selection grouped by toko with auto-select urgent"

git add js/trip.js
git commit -m "feat(trip): add toggle store, capacity enforcement, and counter"

git add js/trip.js
git commit -m "feat(trip): add start trip with DB save and navigation"

git add js/app.js
git commit -m "feat(trip): register trip route in SPA router"

# 4. Push & PR
git push origin feature/task-7-trip-planner
# PR: "feat(trip): Task 7 - Trip Planner"
# Target: develop | Closes #7
```

### File: `js/trip.js`

```javascript
const Trip = {
  selectedPackages: [],
  kapasitas: 5, // default

  render() {
    // 1. Input kapasitas: "🛵 Kapasitas: [input number, default 5] paket"
    // 2. List toko IDM yang punya paket pending, grouped:
    //    ☑ IDM TGR — 3 paket (1 urgent)
    //      ☑ Tina F. — PIN: 5APH5T ⏰ H-1 🔴
    //      ☑ Rani D. — PIN: TY9UGG ⏰ H-5
    //      ☐ Budi S. — PIN: XK3M9P ⏰ H-6
    //    ☐ IDM CKP — 2 paket
    // 3. Sorting: urgent first → deadline ascending
    // 4. Counter: "Selected: 3/5"
    // 5. Disable checkbox jika sudah penuh kapasitas
    // 6. Tombol "🚀 Mulai Trip" → simpan trip ke DB → navigate ke pickup mode
    // 7. Auto-select: urgent packages auto-checked
  },

  handleTogglePackage(packageId) {
    // Toggle package in selectedPackages
    // Check kapasitas limit
    // Update counter
  },

  handleToggleStore(storeId) {
    // Select/deselect semua paket di toko (within kapasitas)
  },

  handleStartTrip() {
    // Validasi: minimal 1 paket selected
    // DB.createTrip({ tanggal: today, package_ids: selectedPackages })
    // Navigate ke Pickup mode dengan trip ID
  }
};
```

### Acceptance Criteria
- [ ] Paket pending grouped by toko
- [ ] Urgent auto-selected dan muncul atas
- [ ] Kapasitas limit enforced (disable checkbox saat penuh)
- [ ] Counter "Selected: X/Y" akurat
- [ ] Toggle toko = toggle semua paket di toko
- [ ] Mulai Trip → simpan → navigasi ke pickup mode
- [ ] ✅ Branch `feature/task-7-trip-planner` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #7

---

## TASK 8: Mode Pickup di IDM

### Tujuan
Tampilan khusus saat suami di IDM — PIN besar, checklist, progress bar.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 8] Mode Pickup di IDM"
#    Labels: enhancement, priority:high, phase:2-advanced
#    Milestone: Phase 2 - Advanced Features

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-8-pickup-mode

# 3. Commit secara atomic:
git add js/pickup.js
git commit -m "feat(pickup): add pickup mode layout with store grouping"

git add js/pickup.js
git commit -m "feat(pickup): add large PIN display (56px) and package cards"

git add js/pickup.js
git commit -m "feat(pickup): add picked up, skip, and complete trip actions"

git add js/pickup.js
git commit -m "feat(pickup): add progress bar and visual feedback animations"

git add css/style.css
git commit -m "style(pickup): add PIN highlight, card animations, and progress bar styles"

# 4. Push & PR
git push origin feature/task-8-pickup-mode
# PR: "feat(pickup): Task 8 - Mode Pickup di IDM"
# Target: develop | Closes #8
```

### File: `js/pickup.js`

```javascript
const Pickup = {
  tripId: null,

  render(tripId) {
    this.tripId = tripId;
    const trip = DB.getTrip(tripId);
    const packages = trip.package_ids.map(id => DB.getPackageById(id));
    // Group by store

    // Untuk setiap toko:
    // Header: "📍 IDM Tiga Raksa (TGR)"
    // Tombol: [📷 SCAN BARCODE] (integrate task 9)
    
    // Untuk setiap paket:
    // - Card besar dengan:
    //   - Badge urgent jika applicable
    //   - PIN ditampilkan SANGAT BESAR (font 56px, bold, centered)
    //   - Background highlight untuk PIN area
    //   - Nama penerima
    //   - AWB
    //   - Barcode visual (dari JsBarcode, task 9)
    //   - 3 tombol: [✅ Diambil] [📷 Scan] [⏭ Skip]
    
    // Progress bar: "2/5 paket diambil" dengan visual bar
    // Tombol "Selesai Trip" → mark remaining as skipped → navigate dashboard
  },

  handlePickedUp(packageId) {
    DB.markAsPickedUp(packageId);
    // Visual: card fade out atau strikethrough + green check
    // Update progress bar
    // Haptic feedback jika supported (navigator.vibrate)
    Utils.showToast('✅ Paket diambil!', 'success');
  },

  handleSkip(packageId) {
    // Mark as skipped (tetap pending, tapi tidak di trip ini)
    // Visual: card dimmed
  },

  handleCompleteTrip() {
    DB.completeTrip(this.tripId);
    Utils.showToast('🎉 Trip selesai!', 'success');
    App.navigate('dashboard');
  }
};
```

### Acceptance Criteria
- [ ] PIN ditampilkan sangat besar (56px) dan mudah dibaca
- [ ] Paket grouped by toko dalam trip
- [ ] Tombol Diambil → update status + visual feedback
- [ ] Progress bar akurat
- [ ] Skip → paket tetap pending
- [ ] Selesai Trip → navigate dashboard
- [ ] Smooth animations pada status change
- [ ] ✅ Branch `feature/task-8-pickup-mode` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #8

> [!TIP]
> Setelah Task 8 selesai dan merge ke `develop`, buat **Release PR** dari `develop` → `main` untuk deploy Phase 2. Tag release sebagai `v0.2.0`.

---

## TASK 9: Barcode Generate & Scanner

### Tujuan
Generate barcode dari AWB + scan barcode fisik untuk auto-checklist.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 9] Barcode Generate & Scanner"
#    Labels: enhancement, priority:medium, phase:2-advanced
#    Milestone: Phase 2 - Advanced Features

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-9-barcode

# 3. Commit secara atomic:
git add index.html
git commit -m "chore(deps): add JsBarcode and html5-qrcode CDN dependencies"

git add js/barcode.js
git commit -m "feat(barcode): add barcode generation with Code128 format"

git add js/barcode.js
git commit -m "feat(barcode): add camera barcode scanner with auto-match AWB"

git add js/barcode.js
git commit -m "feat(barcode): add beep sound and haptic feedback on scan success"

git add js/package.js js/pickup.js js/dashboard.js
git commit -m "feat(barcode): integrate barcode display in detail, pickup, and dashboard"

# 4. Push & PR
git push origin feature/task-9-barcode
# PR: "feat(barcode): Task 9 - Barcode Generate & Scanner"
# Target: develop | Closes #9
```

### Dependencies (CDN)
```html
<!-- Di index.html -->
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"></script>
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
```

### File: `js/barcode.js`

```javascript
const Barcode = {
  scanner: null,

  // Generate barcode image dari AWB number
  generateBarcode(awbNumber, canvasElementId) {
    // JsBarcode(`#${canvasElementId}`, awbNumber, {
    //   format: "CODE128",
    //   width: 2, height: 60,
    //   displayValue: true,
    //   background: "transparent",
    //   lineColor: "#e8e8f0"
    // });
  },

  // Start camera scanner
  startScanner(containerId, onScanSuccess) {
    // this.scanner = new Html5Qrcode(containerId);
    // Config: fps 10, qrbox 250, formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128]
    // On success: 
    //   - decodedText = AWB number
    //   - Find package by AWB in DB
    //   - If found & pending → auto mark picked up
    //   - Play beep sound (AudioContext)
    //   - navigator.vibrate(200)
    //   - Call onScanSuccess callback
    //   - If not found → show warning toast
  },

  stopScanner() {
    // this.scanner.stop()
  },

  // Play beep sound using Web Audio API
  playBeep() {
    // Create oscillator, frequency 800Hz, duration 200ms
  }
};
```

### Integrate dengan:
- `Package.renderDetail()` → tambah canvas barcode
- `Pickup.render()` → tambah barcode per card + scan button
- `Dashboard.renderPackageCard()` → small barcode preview

### Acceptance Criteria
- [ ] Barcode Code128 ter-generate dari AWB number
- [ ] Barcode tampil di detail paket dan pickup mode
- [ ] Scanner bisa buka kamera HP
- [ ] Scan barcode fisik → match AWB → auto mark picked up
- [ ] Beep sound + vibrate saat scan success
- [ ] Warning toast jika AWB tidak ditemukan
- [ ] Scanner bisa di-stop
- [ ] ✅ Branch `feature/task-9-barcode` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #9

---

## TASK 10: Bulk Input & OCR (Tesseract.js)

### Tujuan
Upload screenshot → OCR extract data paket → review → simpan.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 10] Bulk Input & OCR"
#    Labels: enhancement, priority:medium, phase:2-advanced
#    Milestone: Phase 2 - Advanced Features

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-10-ocr

# 3. Commit secara atomic:
git add index.html
git commit -m "chore(deps): add Tesseract.js CDN dependency"

git add js/ocr.js
git commit -m "feat(ocr): add image upload UI with drag-and-drop and multi-file"

git add js/ocr.js
git commit -m "feat(ocr): add OCR processing with AWB/PIN/Nama extraction"

git add js/ocr.js
git commit -m "feat(ocr): add review table with inline edit and batch save"

git add js/ocr.js
git commit -m "feat(ocr): add bulk paste from spreadsheet (tab-separated)"

git add js/app.js
git commit -m "feat(ocr): add sub-menu for Tambah Paket (Manual/Upload/Paste)"

# 4. Push & PR
git push origin feature/task-10-ocr
# PR: "feat(ocr): Task 10 - Bulk Input & OCR"
# Target: develop | Closes #10
```

### Dependencies (CDN)
```html
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
```

### File: `js/ocr.js`

```javascript
const OCR = {
  renderUpload() {
    // Render ke #app-content:
    // 1. Drag & drop zone untuk gambar
    // 2. Tombol "📸 Pilih Gambar" (accept image/*, multiple)
    // 3. Pilih toko IDM tujuan (dropdown)
    // 4. Preview thumbnails gambar yang dipilih
    // 5. Tombol "🔍 Proses OCR"
    // 6. Loading indicator saat processing
  },

  async processImages(files, storeId) {
    // Untuk setiap file:
    // 1. Show progress "Processing image 1/5..."
    // 2. const worker = await Tesseract.createWorker('ind+eng')
    // 3. const result = await worker.recognize(file)
    // 4. Extract data dari result.data.text:
    //    - AWB: regex /[A-Z]{2}\d{13,}/g
    //    - PIN: regex /[A-Z0-9]{5,6}/ (setelah keyword "PIN" atau "Kode")
    //    - Nama: baris setelah "Penerima" atau "Nama"
    // 5. Return array of extracted data
  },

  renderReview(extractedData, storeId) {
    // Tampilkan tabel editable:
    // | # | Nama Penerima | AWB | PIN | Urgent | Aksi |
    // Setiap row bisa diedit inline
    // Toggle urgent per row
    // Tombol "Hapus" per row jika OCR salah
    // Tombol "✅ Simpan Semua" → batch DB.createPackage()
  },

  renderBulkPaste() {
    // Textarea besar untuk paste dari spreadsheet
    // Format: Nama\tAWB\tPIN (tab-separated)
    // Tombol "Parse" → extract → renderReview()
  }
};
```

### Edit `js/app.js`:
- Tambah sub-menu di "Tambah Paket": Manual / Upload Gambar / Paste Bulk

### Acceptance Criteria
- [ ] Drag & drop upload gambar berfungsi
- [ ] Multi-file upload support
- [ ] OCR extract AWB dan PIN dari screenshot
- [ ] Review table tampil dengan data editable
- [ ] Bisa koreksi data sebelum simpan
- [ ] Bulk save berhasil
- [ ] Paste dari spreadsheet → parse tab-separated → review
- [ ] Progress indicator selama OCR processing
- [ ] ✅ Branch `feature/task-10-ocr` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #10

---

## TASK 11: Statistik & Laporan

### Tujuan
Halaman statistik performa pickup.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 11] Statistik & Laporan"
#    Labels: enhancement, priority:medium, phase:3-polish
#    Milestone: Phase 3 - Polish & Deploy

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-11-stats

# 3. Commit secara atomic:
git add js/stats.js
git commit -m "feat(stats): add stat cards with total, pending, picked up, and retur counts"

git add js/stats.js
git commit -m "feat(stats): add CSS-only bar chart (paket per toko) and pie chart"

git add js/stats.js
git commit -m "feat(stats): add export JSON and import restore functionality"

git add css/style.css
git commit -m "style(stats): add chart styles with gradients and animations"

# 4. Push & PR
git push origin feature/task-11-stats
# PR: "feat(stats): Task 11 - Statistik & Laporan"
# Target: develop | Closes #11
```

### File: `js/stats.js`

```javascript
const Stats = {
  render() {
    const stats = DB.getStats();
    // Render cards:
    // 1. Total Paket (all time)
    // 2. Pending (current)
    // 3. Sudah Diambil (with percentage)
    // 4. Retur / Expired (target: 0)
    // 5. Rata-rata Waktu Pickup (hari)
    
    // Chart: Paket per Toko IDM (horizontal bar, CSS only)
    // Chart: Status distribution (pie-like, CSS conic-gradient)
    // 
    // Tombol: Export Data (JSON backup)
    // Tombol: Import Data (restore from JSON)
  }
};
```

### Acceptance Criteria
- [ ] Semua stat cards menampilkan angka yang benar
- [ ] Bar chart per toko berfungsi (CSS only, no library)
- [ ] Export → download JSON file
- [ ] Import → restore data + refresh
- [ ] ✅ Branch `feature/task-11-stats` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #11

---

## TASK 12: PWA Setup

### Tujuan
Buat app installable di HP sebagai PWA.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 12] PWA Setup"
#    Labels: enhancement, priority:high, phase:3-polish
#    Milestone: Phase 3 - Polish & Deploy

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-12-pwa

# 3. Commit secara atomic:
git add manifest.json
git commit -m "feat(pwa): add web app manifest with icons and theme config"

git add sw.js
git commit -m "feat(pwa): add service worker with cache-first strategy"

git add index.html
git commit -m "feat(pwa): register service worker and link manifest"

# (Jika generate icons)
git add icons/
git commit -m "feat(pwa): add app icons (192x192 and 512x512)"

# 4. Push & PR
git push origin feature/task-12-pwa
# PR: "feat(pwa): Task 12 - PWA Setup"
# Target: develop | Closes #12

# 🎉 FINAL RELEASE: Setelah merge, buat PR develop → main
# PR: "release: v1.0.0 - Full Feature Release"
# Tag: v1.0.0
```

### File yang Dibuat

**1. `manifest.json`**
```json
{
  "name": "IndoPaket Tracker",
  "short_name": "IndoPaket",
  "description": "Manajemen pengambilan paket Indomaret",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#0f0f1a",
  "theme_color": "#6c63ff",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**2. `sw.js`** (Service Worker)
```javascript
const CACHE_NAME = 'indopaket-v1';
const ASSETS = [
  '/', '/index.html', '/css/style.css',
  '/js/app.js', '/js/db.js', '/js/utils.js',
  // ... semua JS files
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

**3. Edit `index.html`**
- `<link rel="manifest" href="manifest.json">`
- Register service worker di script tag

### Acceptance Criteria
- [ ] "Install App" prompt muncul di browser mobile
- [ ] App bisa dibuka offline setelah install
- [ ] Icon dan splash screen tampil
- [ ] Theme color sesuai design system
- [ ] ✅ Branch `feature/task-12-pwa` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #12
- [ ] ✅ Final Release PR `develop` → `main` dibuat (tag `v1.0.0`)

---

## Urutan Eksekusi yang Direkomendasikan

```
TASK 1 (Setup) → TASK 2 (DB) → TASK 3 (Store) → TASK 4 (Package) → TASK 5 (Dashboard)
     ↓                                                                    ↓
     └── Initial commit + repo setup                            Release v0.1.0 (MVP)
                                                                     ↓
TASK 6 (Reminder) → TASK 7 (Trip) → TASK 8 (Pickup)
                                          ↓
                                    Release v0.2.0
                                          ↓
TASK 9 (Barcode) → TASK 10 (OCR) → TASK 11 (Stats) → TASK 12 (PWA)
                                                            ↓
                                                      Release v1.0.0 🎉
```

> [!IMPORTANT]
> Task 1 & 2 HARUS dikerjakan pertama. Setelah itu, task 3-5 berurutan. Task 6+ bisa dikerjakan setelah task 5 selesai.

---

## 📋 GitHub Release Checklist

### Release v0.1.0 — MVP (setelah Task 5)
```bash
# Merge develop → main
git checkout main
git pull origin main
git merge develop
git tag -a v0.1.0 -m "release: Phase 1 MVP - Core Features"
git push origin main --tags

# Buat GitHub Release
# Title: "v0.1.0 — MVP: Core Package Tracking"
# Body:
# - ✅ Project setup & design system
# - ✅ LocalStorage data layer
# - ✅ CRUD Toko IDM
# - ✅ CRUD Paket & form input
# - ✅ Dashboard dengan filter & search

# Enable GitHub Pages (Settings → Pages → Source: main)
```

### Release v0.2.0 — Advanced Features (setelah Task 8)
```bash
git checkout main
git merge develop
git tag -a v0.2.0 -m "release: Phase 2 - Advanced Features"
git push origin main --tags

# GitHub Release:
# - ✅ Reminder & deadline system
# - ✅ Trip planner
# - ✅ Pickup mode di IDM
```

### Release v1.0.0 — Full Release (setelah Task 12)
```bash
git checkout main
git merge develop
git tag -a v1.0.0 -m "release: v1.0.0 - Full Feature Release"
git push origin main --tags

# GitHub Release:
# - ✅ Barcode generate & scanner
# - ✅ Bulk input & OCR
# - ✅ Statistik & laporan
# - ✅ PWA (installable, offline-ready)
```

> [!TIP]
> Gunakan **GitHub Actions** (optional) untuk auto-deploy ke GitHub Pages setiap kali ada push ke `main`. Buat file `.github/workflows/deploy.yml` jika dibutuhkan.
