# 📦 IndoPaket Tracker — Implementation Plan (Opsi A) Part 1

> **Tech Stack**: Vanilla HTML/CSS/JS + LocalStorage + GitHub Pages + PWA
> **Target**: Semua level Gemini bisa eksekusi setiap task secara independen

---

## Aturan Umum untuk Setiap Task

1. Setiap task HARUS bisa dieksekusi **independen** tanpa konteks task lain
2. Setiap task menyebutkan **file mana yang dibuat/diedit**
3. Setiap task menyebutkan **acceptance criteria** yang jelas
4. Gunakan `localStorage` sebagai database
5. Semua UI harus **mobile-first** dan responsive
6. Gunakan **CSS variables** untuk design system
7. Semua ID element harus unik dan deskriptif

---

## 🔀 GitHub Best Practices — Aturan Global

> [!IMPORTANT]
> Aturan ini berlaku untuk **SEMUA task**. Setiap task HARUS mengikuti workflow GitHub di bawah ini.

### Branching Strategy

```
main (protected) ← production-ready, deploy ke GitHub Pages
  └── develop ← integration branch, semua feature merge ke sini
        ├── feature/task-1-setup-design-system
        ├── feature/task-2-data-layer
        ├── feature/task-3-crud-toko
        ├── feature/task-4-crud-paket
        ├── feature/task-5-dashboard
        ├── feature/task-6-reminder
        ├── feature/task-7-trip-planner
        ├── feature/task-8-pickup-mode
        ├── feature/task-9-barcode
        ├── feature/task-10-ocr
        ├── feature/task-11-stats
        ├── feature/task-12-pwa
        ├── fix/[deskripsi-bug]
        └── hotfix/[critical-fix]
```

**Naming Convention:**
- Feature: `feature/task-{N}-{short-description}`
- Bugfix: `fix/{short-description}`
- Hotfix (langsung ke main): `hotfix/{short-description}`

### Commit Convention (Conventional Commits)

Format: `<type>(<scope>): <description>`

```
feat(setup): init project structure and design system
feat(db): add localStorage CRUD abstraction layer
feat(store): add toko IDM CRUD UI
feat(package): add package form and detail view
feat(dashboard): add dashboard with filter and search
fix(db): handle localStorage quota exceeded error
style(css): adjust glassmorphism card opacity
refactor(utils): extract date formatting helpers
docs(readme): add setup instructions
chore(deps): add JsBarcode CDN link
test(db): add manual test cases for CRUD
```

**Type yang dipakai:**
| Type | Kapan dipakai |
|------|--------------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `style` | Perubahan CSS/UI tanpa logic change |
| `refactor` | Restructure code tanpa ubah behavior |
| `docs` | Dokumentasi |
| `chore` | Maintenance (deps, config) |
| `test` | Test-related changes |

### Pull Request (PR) Workflow

Setiap task menghasilkan **1 Pull Request**:

```
1. Buat branch → git checkout -b feature/task-{N}-{desc} develop
2. Commit secara atomic (1 commit per logical change)
3. Push → git push origin feature/task-{N}-{desc}
4. Buat PR ke `develop` dengan template:
   - Title: "feat(scope): Task N - Description"
   - Body: Gunakan PR Template (lihat di bawah)
5. Self-review checklist ✅
6. Merge (Squash & Merge untuk history bersih)
7. Delete branch setelah merge
```

**PR Template:**
```markdown
## 📋 Summary
<!-- Apa yang berubah dan kenapa -->

## 🔗 Related Issue
Closes #[issue-number]

## 📝 Changes
- [ ] File created/modified: ...
- [ ] Feature implemented: ...

## ✅ Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## 📱 Screenshots (Mobile)
<!-- Attach screenshot tampilan mobile -->

## 🧪 Testing
- [ ] Tested on Chrome Mobile
- [ ] Tested on Safari iOS
- [ ] localStorage persists after refresh
- [ ] No console errors

## 📦 Self-Review Checklist
- [ ] Code follows project conventions
- [ ] CSS variables used (no hardcoded colors)
- [ ] All IDs unique and descriptive
- [ ] Mobile-first responsive
- [ ] No `console.log` left in code
- [ ] Commit messages follow conventional commits
```

### Issue Tracking (GitHub Issues)

Setiap task = 1 GitHub Issue. Format:

```markdown
Title: [TASK N] Short Description
Labels: enhancement, priority:high, task:N
Milestone: Phase 1 - MVP (Task 1-5) / Phase 2 - Advanced (Task 6-10) / Phase 3 - Polish (Task 11-12)

## Description
<!-- Copy tujuan dari task -->

## Acceptance Criteria
<!-- Copy dari task -->

## Technical Notes
- Files: list of files
- Dependencies: list of dependencies
```

**Labels yang dipakai:**
| Label | Warna | Keterangan |
|-------|-------|------------|
| `enhancement` | 🟢 | Fitur baru |
| `bug` | 🔴 | Bug report |
| `priority:critical` | 🔴 | Harus fix segera |
| `priority:high` | 🟠 | Penting |
| `priority:medium` | 🟡 | Normal |
| `priority:low` | 🔵 | Nice to have |
| `phase:1-mvp` | 🟣 | Task 1-5 |
| `phase:2-advanced` | 🟣 | Task 6-10 |
| `phase:3-polish` | 🟣 | Task 11-12 |

### GitHub Project Board

Gunakan **GitHub Projects** (Kanban):

```
📋 Backlog → 🚧 In Progress → 👀 In Review → ✅ Done
```

### Repository Setup (Awal Project)

```bash
# 1. Init repo
git init
git remote add origin https://github.com/{user}/indopaket-tracker.git

# 2. Buat .gitignore
echo "node_modules/\n.DS_Store\n*.log\nthumbs.db" > .gitignore

# 3. Buat README.md
# 4. Initial commit
git add .
git commit -m "chore(init): initial project setup"
git push -u origin main

# 5. Buat branch develop
git checkout -b develop
git push -u origin develop

# 6. Setup branch protection (di GitHub Settings)
#    - main: Require PR, no direct push
#    - develop: Require PR (optional untuk solo dev)
```

### `.gitignore`

```
# OS
.DS_Store
Thumbs.db
Desktop.ini

# Editor
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log

# Dependencies (jika nanti pakai npm)
node_modules/

# Environment
.env
.env.local
```

---

## Struktur Project Final

```
indopaket-tracker/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── db.js
│   ├── store.js
│   ├── package.js
│   ├── dashboard.js
│   ├── trip.js
│   ├── pickup.js
│   ├── barcode.js
│   ├── ocr.js
│   ├── reminder.js
│   ├── stats.js
│   └── utils.js
├── manifest.json
├── sw.js
├── .gitignore
├── README.md
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md
    └── ISSUE_TEMPLATE/
        ├── feature_task.md
        └── bug_report.md
```

---

## TASK 1: Project Setup & Design System

### Tujuan
Buat fondasi project: file HTML utama, CSS design system, dan utility JS.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 1] Project Setup & Design System"
#    Labels: enhancement, priority:critical, phase:1-mvp
#    Milestone: Phase 1 - MVP

# 2. Buat branch dari develop
git checkout develop
git pull origin develop
git checkout -b feature/task-1-setup-design-system

# 3. Kerjakan task (lihat detail di bawah)

# 4. Commit secara atomic:
git add .gitignore README.md
git commit -m "chore(init): add gitignore and README"

git add index.html
git commit -m "feat(setup): add HTML boilerplate with mobile meta and nav structure"

git add css/style.css
git commit -m "feat(setup): add CSS design system with dark theme and glassmorphism"

git add js/utils.js
git commit -m "feat(setup): add utility functions (generateId, formatDate, toast)"

git add js/app.js
git commit -m "feat(setup): add SPA router and navigation handler"

git add .github/
git commit -m "chore(setup): add PR and issue templates"

# 5. Push & buat PR
git push origin feature/task-1-setup-design-system
# Buat PR: "feat(setup): Task 1 - Project Setup & Design System"
# PR target: develop
# Body: Gunakan PR template, isi semua checklist

# 6. Self-review → Merge (Squash & Merge) → Delete branch
```

### File yang Dibuat

**1. `index.html`**
- HTML5 boilerplate dengan meta viewport mobile
- Link ke Google Fonts (Inter)
- Link ke `css/style.css`
- Struktur: `<header>`, `<main id="app-content">`, `<nav>` bottom navigation
- Bottom nav items: Dashboard, Tambah Paket, Trip, Statistik
- Script tags untuk semua JS files (defer)
- Meta tags SEO: title "IndoPaket Tracker", description, theme-color

**2. `css/style.css`**
- CSS Reset minimal
- CSS Variables:
  - `--color-bg: #0f0f1a`
  - `--color-surface: #1a1a2e`
  - `--color-surface-2: #25253d`
  - `--color-primary: #6c63ff`
  - `--color-success: #2ecc71`
  - `--color-warning: #f39c12`
  - `--color-danger: #e74c3c`
  - `--color-urgent: #ff3b5c`
  - `--color-text: #e8e8f0`
  - `--color-text-muted: #8888a0`
  - `--font-main: 'Inter', sans-serif`
  - `--radius: 12px`
- Components: `.badge`, `.btn`, `.btn-primary`, `.card` (glassmorphism), `.form-group`, `.input`, `.modal-overlay`
- Layout: fixed header, fixed bottom nav, scrollable main
- Animations: fadeIn, slideUp keyframes

**3. `js/utils.js`**
- `Utils.generateId()` → unique string ID
- `Utils.formatDate(dateStr)` → "15 Jun 2026"
- `Utils.daysUntilDeadline(deadlineStr)` → integer
- `Utils.getDeadlineStatus(deadlineStr)` → {label, cssClass, daysLeft}
- `Utils.showToast(message, type)` → toast notification
- `Utils.calculateDeadline(tanggalMasuk)` → tanggal + 7 hari
- `Utils.debounce(fn, delay)` → debounced function

**4. `js/app.js`**
- Simple SPA router
- `App.init()` → setup nav, navigate to dashboard
- `App.navigate(page)` → render correct page
- Bottom nav click handlers

**5. `.github/PULL_REQUEST_TEMPLATE.md`**
- Template standar PR (lihat PR Template di atas)

**6. `.github/ISSUE_TEMPLATE/feature_task.md`**
- Template untuk task issue

**7. `.github/ISSUE_TEMPLATE/bug_report.md`**
- Template untuk bug report

### Acceptance Criteria
- [ ] Dark theme tampil dengan header dan bottom nav
- [ ] 4 nav items clickable
- [ ] Font Inter loaded
- [ ] Cards punya glassmorphism effect
- [ ] Mobile responsive (375px)
- [ ] ✅ `.gitignore` ada dan benar
- [ ] ✅ README.md ada dengan deskripsi project
- [ ] ✅ PR & Issue templates ada di `.github/`
- [ ] ✅ Branch `feature/task-1-setup-design-system` dibuat dari `develop`
- [ ] ✅ Semua commits mengikuti conventional commits format
- [ ] ✅ PR dibuat dengan template terisi lengkap

---

## TASK 2: Data Layer (LocalStorage)

### Tujuan
Buat abstraksi data layer untuk semua operasi CRUD ke localStorage.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 2] Data Layer (LocalStorage)"
#    Labels: enhancement, priority:critical, phase:1-mvp
#    Milestone: Phase 1 - MVP

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-2-data-layer

# 3. Commit secara atomic:
git add js/db.js
git commit -m "feat(db): add generic CRUD operations for localStorage"

# (setelah tambah store methods)
git add js/db.js
git commit -m "feat(db): add store-specific CRUD methods"

# (setelah tambah package methods)
git add js/db.js
git commit -m "feat(db): add package CRUD with search and sort"

# (setelah tambah trip + stats + backup)
git add js/db.js
git commit -m "feat(db): add trip CRUD, stats aggregation, and backup"

# 4. Push & PR
git push origin feature/task-2-data-layer
# PR: "feat(db): Task 2 - Data Layer (LocalStorage)"
# Target: develop | Closes #2
```

### File yang Dibuat: `js/db.js`

```javascript
const DB = {
  KEYS: { STORES, PACKAGES, TRIPS },
  
  // Generic CRUD
  _getAll(key), _save(key, data), _getById(key, id),
  _create(key, item), _update(key, id, updates), _delete(key, id),
  
  // Store CRUD
  getAllStores(), createStore(store), updateStore(id, updates),
  deleteStore(id), getStoreByKode(kode),
  
  // Package CRUD
  getAllPackages(), getPackagesByStore(storeId),
  getPackagesByStatus(status), getPendingPackages(),
  getUrgentPackages(), createPackage(pkg), updatePackage(id, updates),
  markAsPickedUp(id), markAsReturned(id), deletePackage(id),
  searchPackages(query),
  
  // Trip CRUD
  getAllTrips(), createTrip(trip), completeTrip(id),
  
  // Stats
  getStats() → {totalPackages, pendingCount, pickedCount, returnedCount, urgentCount, avgPickupDays, packagesByStore},
  
  // Backup
  exportAll(), importAll(jsonStr)
};
```

**Key behaviors:**
- `createPackage()` auto-sets `status='pending'` dan `barcode_data=nomor_awb`
- `getPendingPackages()` sorts by urgent first, then deadline ascending
- `markAsPickedUp()` sets status dan tanggal_pickup timestamp
- `searchPackages()` searches nama, AWB, PIN (case-insensitive)

### Acceptance Criteria
- [ ] CRUD operations work for stores, packages, trips
- [ ] Data persists after page refresh
- [ ] getPendingPackages sorted correctly
- [ ] searchPackages finds by name/AWB/PIN
- [ ] exportAll/importAll backup works
- [ ] ✅ Branch `feature/task-2-data-layer` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #2

---

## TASK 3: CRUD Toko IDM

### Tujuan
UI untuk mengelola daftar toko Indomaret.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 3] CRUD Toko IDM"
#    Labels: enhancement, priority:high, phase:1-mvp
#    Milestone: Phase 1 - MVP

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-3-crud-toko

# 3. Commit secara atomic:
git add js/store.js
git commit -m "feat(store): add toko list rendering with active package count"

git add js/store.js
git commit -m "feat(store): add toko form with validation (unique kode IDM)"

git add js/store.js
git commit -m "feat(store): add edit and delete with confirmation"

git add js/app.js
git commit -m "feat(store): register stores route in SPA router"

# 4. Push & PR
git push origin feature/task-3-crud-toko
# PR: "feat(store): Task 3 - CRUD Toko IDM"
# Target: develop | Closes #3
```

### File: `js/store.js`

- `Store.render()` → list semua toko dalam cards (kode, nama, alamat, jumlah paket aktif)
- `Store.renderForm(storeId?)` → form tambah/edit (Kode IDM, Nama, Alamat)
- `Store.handleSave()` → validasi + DB call + toast
- `Store.handleDelete()` → confirm + delete

### Edit: `js/app.js` tambah route 'stores'

### Acceptance Criteria
- [ ] Tambah toko baru berhasil
- [ ] Edit toko existing berhasil
- [ ] Hapus dengan konfirmasi
- [ ] Kode IDM tidak boleh duplikat
- [ ] Data persist after refresh
- [ ] ✅ Branch `feature/task-3-crud-toko` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #3

---

## TASK 4: CRUD Paket & Form Input

### Tujuan
Form input paket — fitur utama untuk istri.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 4] CRUD Paket & Form Input"
#    Labels: enhancement, priority:critical, phase:1-mvp
#    Milestone: Phase 1 - MVP

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-4-crud-paket

# 3. Commit secara atomic:
git add js/package.js
git commit -m "feat(package): add package form with toko dropdown and auto-deadline"

git add js/package.js
git commit -m "feat(package): add package detail view with large PIN display"

git add js/package.js
git commit -m "feat(package): add mark picked up, edit, and delete actions"

git add css/style.css
git commit -m "style(package): add urgent toggle styling and PIN highlight"

# 4. Push & PR
git push origin feature/task-4-crud-paket
# PR: "feat(package): Task 4 - CRUD Paket & Form Input"
# Target: develop | Closes #4
```

### File: `js/package.js`

- `Package.renderForm(packageId?)`:
  - Dropdown Toko IDM (dari DB)
  - Input: Nama Penerima, Nomor AWB, Kode PIN, Invoice (optional)
  - Date: Tanggal Masuk (default hari ini), Deadline (auto H+7)
  - Toggle: Urgent (ON/OFF)
  - Textarea: Catatan
- `Package.handleSave()` → validasi + DB + navigate dashboard
- `Package.renderDetail(id)` → semua info + PIN BESAR (48px) + action buttons
- `Package.handleMarkPickedUp(id)` → update status

### Acceptance Criteria
- [ ] Dropdown toko terisi dari DB
- [ ] Deadline auto H+7
- [ ] Urgent toggle visual feedback
- [ ] Detail: PIN besar 48px
- [ ] Mark picked up works
- [ ] Edit & delete work
- [ ] ✅ Branch `feature/task-4-crud-paket` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #4

---

## TASK 5: Dashboard & Filter

### Tujuan
Halaman utama — semua paket grouped by toko, dengan filter & search.

### 🔀 GitHub Workflow untuk Task Ini

```bash
# 1. Buat Issue: "[TASK 5] Dashboard & Filter"
#    Labels: enhancement, priority:critical, phase:1-mvp
#    Milestone: Phase 1 - MVP

# 2. Buat branch
git checkout develop
git pull origin develop
git checkout -b feature/task-5-dashboard

# 3. Commit secara atomic:
git add js/dashboard.js
git commit -m "feat(dashboard): add package list grouped by toko with urgent sorting"

git add js/dashboard.js
git commit -m "feat(dashboard): add search bar with debounce (AWB/Nama/PIN)"

git add js/dashboard.js
git commit -m "feat(dashboard): add filter tabs (Semua/Pending/Urgent/Diambil/Retur)"

git add js/dashboard.js
git commit -m "feat(dashboard): add deadline alert bar and summary counts"

git add js/dashboard.js css/style.css
git commit -m "feat(dashboard): add FAB button, empty state, and animations"

# 4. Push & PR
git push origin feature/task-5-dashboard
# PR: "feat(dashboard): Task 5 - Dashboard & Filter"
# Target: develop | Closes #5

# 🎉 MILESTONE: Setelah Task 5 merge ke develop, buat PR develop → main
# PR: "release: Phase 1 MVP - Core Features (Task 1-5)"
# Ini adalah first release ke GitHub Pages!
```

> [!TIP]
> Setelah Task 5 selesai dan merge ke `develop`, buat **Release PR** dari `develop` → `main` untuk deploy MVP pertama ke GitHub Pages. Tag release sebagai `v0.1.0`.

### File: `js/dashboard.js`

- Alert bar jika ada paket deadline ≤ 2 hari
- Search bar (debounce 300ms) untuk AWB/Nama/PIN
- Filter tabs: Semua, Pending, Urgent, Diambil, Retur
- Summary bar: total/pending/urgent counts
- Package list grouped by toko IDM
  - Dalam group: urgent first → deadline ascending
  - Card: badge, nama, AWB, deadline countdown
  - Click → detail
- FAB "+" untuk tambah paket
- Empty state jika kosong

### Acceptance Criteria
- [ ] Paket grouped by toko
- [ ] Urgent muncul paling atas per group
- [ ] Filter tabs work
- [ ] Search works (nama/AWB/PIN)
- [ ] Alert bar muncul jika deadline ≤ 2 hari
- [ ] FAB navigasi ke form
- [ ] Smooth animations
- [ ] ✅ Branch `feature/task-5-dashboard` dibuat dari `develop`
- [ ] ✅ Commits atomic dan mengikuti conventional commits
- [ ] ✅ PR dibuat → Closes #5
- [ ] ✅ Release PR `develop` → `main` dibuat setelah merge (tag `v0.1.0`)

---

> **Lanjutan di Part 2**: Task 6-10 (Reminder, Trip Planner, Pickup Mode, Barcode, OCR, Stats, PWA)
