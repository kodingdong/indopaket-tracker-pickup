// js/settings.js — Settings Page with Sync Configuration

const Settings = {
    render: function() {
        const container = document.getElementById('view-settings');
        if (!container) return;

        const cfg = window.SyncEngine ? window.SyncEngine.getConfig() : {};
        const deviceId = window.SyncEngine ? window.SyncEngine.getDeviceId() : 'N/A';
        const status = window.SyncEngine ? window.SyncEngine.getSyncStatus() : {};
        const lastSyncDisplay = cfg.lastSync ? this._timeAgo(cfg.lastSync) : 'Belum pernah sync';

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <h2 style="font-size:1.5rem;margin:0;">⚙️ Pengaturan</h2>
            </div>

            <!-- Device Info -->
            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;">📱 Info Device</h3>
                <p style="font-size:0.75rem;color:var(--color-text-muted);margin-bottom:0.75rem;">Device ID: <code>${deviceId}</code></p>
                <div class="form-group" style="margin-bottom:0.75rem;">
                    <label style="font-size:0.85rem;color:var(--color-text-muted);">Nama Device</label>
                    <input class="input" id="settings-device-name" type="text" value="${cfg.deviceName || ''}" placeholder="e.g. HP Istri / HP Suami">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.85rem;color:var(--color-text-muted);">Role</label>
                    <select class="input" id="settings-device-role">
                        <option value="input" ${cfg.role === 'input' ? 'selected' : ''}>📥 Input</option>
                        <option value="picker" ${cfg.role === 'picker' ? 'selected' : ''}>🛵 Picker</option>
                        <option value="admin" ${cfg.role === 'admin' ? 'selected' : ''}>🖥️ Admin</option>
                    </select>
                </div>
            </div>

            <!-- OCR Engine -->
            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;">📷 OCR Engine</h3>
                <p style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:0.75rem;">
                    Pilih engine untuk ekstraksi data dari gambar resi.
                </p>
                <div class="form-group" style="margin-bottom:0.75rem;">
                    <label style="font-size:0.85rem;color:var(--color-text-muted);">Engine OCR</label>
                    <select class="input" id="settings-ocr-engine" onchange="Settings.onOcrEngineChange()">
                        <option value="tesseract" ${(localStorage.getItem('paket_ocr_engine') || 'tesseract') === 'tesseract' ? 'selected' : ''}>🔤 Tesseract.js (Lokal / Gratis)</option>
                        <option value="ocrspace" ${localStorage.getItem('paket_ocr_engine') === 'ocrspace' ? 'selected' : ''}>🌐 OCR.space (API Key)</option>
                    </select>
                </div>
                <div id="settings-ocrspace-config" style="display:${localStorage.getItem('paket_ocr_engine') === 'ocrspace' ? 'block' : 'none'};">
                    <p style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:0.75rem;">
                        Gratis 500 request/hari. Daftar di
                        <a href="https://ocr.space/ocrapi" target="_blank" style="color:var(--color-primary);">OCR.space</a>.
                    </p>
                    <div class="form-group" style="margin-bottom:0.75rem;">
                        <label style="font-size:0.85rem;color:var(--color-text-muted);">API Key</label>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <input class="input" id="settings-ocrspace-key" type="password" value="${localStorage.getItem('paket_ocrspace_api_key') || ''}" placeholder="Masukkan API Key OCR.space" style="flex:1; min-width:0; font-family:monospace;">
                            <button class="btn" style="flex:0 0 36px; width:36px; height:36px; min-width:36px; padding:0; display:flex; align-items:center; justify-content:center; background:var(--color-surface-2); color:white; font-size:0.9rem;" onclick="var el=document.getElementById('settings-ocrspace-key');el.type=el.type==='password'?'text':'password';">👁</button>
                        </div>
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                        <button class="btn btn-primary" style="flex:1;" onclick="Settings.saveOcrSpaceKey()">💾 Simpan</button>
                        <button class="btn" style="flex:1;background:var(--color-surface-2);color:white;" onclick="Settings.testOcrSpaceKey()">🧪 Test</button>
                    </div>
                    <div id="settings-ocrspace-status" style="font-size:0.85rem;margin-top:0.75rem;display:none;"></div>
                </div>
                <div id="settings-tesseract-info" style="display:${(localStorage.getItem('paket_ocr_engine') || 'tesseract') === 'tesseract' ? 'block' : 'none'};">
                    <p style="font-size:0.8rem;color:var(--color-text-muted);margin:0.5rem 0 0;">
                        ✅ Tesseract.js berjalan di browser, tidak butuh API Key. Hasil parsing perlu regex manual.
                    </p>
                </div>
            </div>

            <!-- Google Sheets Sync -->
            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;">☁️ Google Sheets Sync</h3>
                <div class="form-group" style="margin-bottom:0.75rem;">
                    <label style="font-size:0.85rem;color:var(--color-text-muted);">Apps Script URL</label>
                    <input class="input" id="settings-script-url" type="url" value="${cfg.scriptUrl || ''}" placeholder="https://script.google.com/macros/s/.../exec" style="font-size:0.8rem;">
                </div>
                <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;">
                    <button class="btn" style="flex:1;background:var(--color-surface-2);color:white;padding:0.5rem;" onclick="Settings.testConnection()">🔗 Test Koneksi</button>
                </div>
                <div id="settings-connection-status" style="font-size:0.85rem;margin-bottom:0.75rem;display:none;"></div>

                <div class="form-group" style="margin-bottom:0.75rem;">
                    <label style="font-size:0.85rem;color:var(--color-text-muted);">Sync Mode</label>
                    <select class="input" id="settings-sync-mode" onchange="Settings.onModeChange()">
                        <option value="off" ${cfg.mode === 'off' ? 'selected' : ''}>🔴 Off — Tidak sync</option>
                        <option value="manual" ${cfg.mode === 'manual' ? 'selected' : ''}>🟡 Manual — Sync saat ditekan</option>
                        <option value="auto" ${cfg.mode === 'auto' ? 'selected' : ''}>🟢 Auto — Sync otomatis</option>
                    </select>
                </div>
                <div id="settings-auto-interval" style="margin-bottom:0.75rem;display:${cfg.mode === 'auto' ? 'block' : 'none'};">
                    <label style="font-size:0.85rem;color:var(--color-text-muted);">Interval Auto Sync</label>
                    <select class="input" id="settings-interval">
                        <option value="5" ${cfg.autoIntervalMin == 5 ? 'selected' : ''}>Setiap 5 menit</option>
                        <option value="10" ${cfg.autoIntervalMin == 10 ? 'selected' : ''}>Setiap 10 menit</option>
                        <option value="15" ${cfg.autoIntervalMin == 15 ? 'selected' : ''}>Setiap 15 menit</option>
                        <option value="30" ${cfg.autoIntervalMin == 30 ? 'selected' : ''}>Setiap 30 menit</option>
                    </select>
                </div>
                <button class="btn btn-primary" style="width:100%;" onclick="Settings.saveSettings()">💾 Simpan Konfigurasi</button>
            </div>

            <!-- Connected Devices -->
            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;">📱 Device Terhubung</h3>
                <div id="settings-devices-list" style="font-size:0.85rem;color:var(--color-text-muted);">
                    ${status.isConfigured ? '<p>Memuat...</p>' : '<p>Konfigurasi sync terlebih dahulu</p>'}
                </div>
            </div>

            <!-- Sync Actions -->
            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;">🔄 Sync Actions</h3>
                <p style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:0.75rem;">
                    Last sync: <strong>${lastSyncDisplay}</strong>
                </p>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    <button class="btn btn-primary" onclick="Settings.handleSyncNow()" ${!status.isConfigured || cfg.mode === 'off' ? 'disabled style="opacity:0.5;"' : ''}>🔄 Sync Sekarang</button>
                    <div style="display:flex;gap:0.5rem;">
                        <button class="btn" style="flex:1;background:var(--color-surface-2);color:white;" onclick="Settings.handleForcePush()" ${!status.isConfigured ? 'disabled style="opacity:0.5;"' : ''}>⬆️ Force Push</button>
                        <button class="btn" style="flex:1;background:var(--color-surface-2);color:white;" onclick="Settings.handleForcePull()" ${!status.isConfigured ? 'disabled style="opacity:0.5;"' : ''}>⬇️ Force Pull</button>
                    </div>
                </div>
            </div>

            <!-- Sync Log -->
            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;">📋 Sync Log</h3>
                <div id="settings-sync-log" style="max-height:200px;overflow-y:auto;font-size:0.8rem;">
                    ${this._renderSyncLog()}
                </div>
            </div>

            <!-- Data Management -->
            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;">💾 Data Management</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                    <button class="btn" style="background:var(--color-surface-2);color:white;padding:0.5rem;" onclick="Settings.exportJSON()">📤 Export JSON</button>
                    <button class="btn" style="background:var(--color-surface-2);color:white;padding:0.5rem;" onclick="Settings.exportCSV()">📤 Export CSV</button>
                    <button class="btn" style="background:var(--color-surface-2);color:white;padding:0.5rem;" onclick="document.getElementById('import-json-file').click()">📥 Import JSON</button>
                    <button class="btn" style="background:var(--color-surface-2);color:white;padding:0.5rem;" onclick="document.getElementById('import-csv-file').click()">📥 Import CSV</button>
                </div>
                <input type="file" id="import-json-file" accept=".json" style="display:none;" onchange="Settings.importJSON(event)">
                <input type="file" id="import-csv-file" accept=".csv" style="display:none;" onchange="Settings.importCSV(event)">
            </div>

            <!-- Danger Zone -->
            <div class="card glassmorphism" style="border:1px solid var(--color-danger);margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;color:var(--color-danger);">⚠️ Danger Zone</h3>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    <button class="btn" style="background:var(--color-danger);color:white;" onclick="Settings.clearLocalData()">🗑️ Hapus Semua Data Lokal</button>
                    <button class="btn" style="background:var(--color-danger);color:white;" onclick="Settings.clearCloudData()" ${!status.isConfigured ? 'disabled style="opacity:0.5;background:var(--color-danger);color:white;"' : ''}>🗑️ Hapus Semua Data Cloud</button>
                </div>
            </div>
        `;

        // Load connected devices if configured
        if (status.isConfigured) this._loadDevices();
    },

    // --- Mode Change Handler ---
    onModeChange: function() {
        var mode = document.getElementById('settings-sync-mode').value;
        document.getElementById('settings-auto-interval').style.display = mode === 'auto' ? 'block' : 'none';
    },

    // --- Connection Test ---
    testConnection: async function() {
        var statusEl = document.getElementById('settings-connection-status');
        var url = document.getElementById('settings-script-url').value.trim();
        if (!url) {
            statusEl.style.display = 'block';
            statusEl.innerHTML = '<span style="color:var(--color-danger);">❌ Masukkan URL terlebih dahulu</span>';
            return;
        }
        statusEl.style.display = 'block';
        statusEl.innerHTML = '<span style="color:var(--color-warning);">⏳ Testing...</span>';

        var result = await window.SyncEngine.testConnection(url);
        if (result.success) {
            statusEl.innerHTML = '<span style="color:var(--color-success);">✅ ' + result.message + '</span>';
        } else {
            statusEl.innerHTML = '<span style="color:var(--color-danger);">❌ ' + result.message + '</span>';
        }
    },

    // --- Save Config ---
    saveSettings: async function() {
        var cfg = window.SyncEngine.getConfig();
        cfg.scriptUrl = document.getElementById('settings-script-url').value.trim();
        cfg.deviceName = document.getElementById('settings-device-name').value.trim();
        cfg.role = document.getElementById('settings-device-role').value;
        cfg.mode = document.getElementById('settings-sync-mode').value;

        var intervalEl = document.getElementById('settings-interval');
        if (intervalEl) cfg.autoIntervalMin = parseInt(intervalEl.value) || 5;

        window.SyncEngine.saveConfig(cfg);

        // Register device if URL is set
        if (cfg.scriptUrl && cfg.deviceName) {
            await window.SyncEngine.registerDevice();
        }

        // Handle auto sync
        if (cfg.mode === 'auto' && cfg.scriptUrl) {
            window.SyncEngine.startAutoSync(cfg.autoIntervalMin);
        } else {
            window.SyncEngine.stopAutoSync();
        }

        window.Utils.showToast('✅ Konfigurasi tersimpan!', 'success');
        if (window.App && window.App.updateSyncIndicator) window.App.updateSyncIndicator();
        if (window.App && window.App.updateAdminNavVisibility) window.App.updateAdminNavVisibility();
        if (window.AuditLog) window.AuditLog.log('CONFIG_CHANGE', 'settings', { role: cfg.role, mode: cfg.mode, deviceName: cfg.deviceName });
    },

    // --- OCR Engine ---
    onOcrEngineChange: function() {
        var engine = document.getElementById('settings-ocr-engine').value;
        localStorage.setItem('paket_ocr_engine', engine);
        document.getElementById('settings-ocrspace-config').style.display = engine === 'ocrspace' ? 'block' : 'none';
        document.getElementById('settings-tesseract-info').style.display = engine === 'tesseract' ? 'block' : 'none';
        window.Utils.showToast('✅ OCR engine: ' + (engine === 'tesseract' ? 'Tesseract.js' : 'OCR.space'), 'success');
    },

    saveOcrSpaceKey: function() {
        var key = document.getElementById('settings-ocrspace-key').value.trim();
        if (!key) {
            localStorage.removeItem('paket_ocrspace_api_key');
            window.Utils.showToast('🗑️ API Key dihapus', 'info');
        } else {
            localStorage.setItem('paket_ocrspace_api_key', key);
            window.Utils.showToast('✅ API Key OCR.space tersimpan!', 'success');
        }
    },

    testOcrSpaceKey: async function() {
        var statusEl = document.getElementById('settings-ocrspace-status');
        var key = document.getElementById('settings-ocrspace-key').value.trim() || localStorage.getItem('paket_ocrspace_api_key') || '';
        if (!key) {
            statusEl.style.display = 'block';
            statusEl.innerHTML = '<span style="color:var(--color-danger);">❌ Masukkan API Key terlebih dahulu</span>';
            return;
        }
        statusEl.style.display = 'block';
        statusEl.innerHTML = '<span style="color:var(--color-warning);">⏳ Testing...</span>';
        try {
            // Create a tiny test image (1x1 white pixel PNG)
            var canvas = document.createElement('canvas');
            canvas.width = 100; canvas.height = 30;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0,0,100,30);
            ctx.fillStyle = '#000'; ctx.font = '14px sans-serif'; ctx.fillText('test', 10, 20);
            var dataUrl = canvas.toDataURL('image/png');
            var base64 = dataUrl.split(',')[1];
            var formData = new FormData();
            formData.append('apikey', key);
            formData.append('base64Image', 'data:image/png;base64,' + base64);
            formData.append('language', 'eng');
            var resp = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: formData });
            var result = await resp.json();
            if (!result.IsErroredOnProcessing) {
                statusEl.innerHTML = '<span style="color:var(--color-success);">✅ API Key valid! OCR.space siap digunakan.</span>';
            } else {
                statusEl.innerHTML = '<span style="color:var(--color-danger);">❌ ' + (result.ErrorMessage || 'Key tidak valid') + '</span>';
            }
        } catch (e) {
            statusEl.innerHTML = '<span style="color:var(--color-danger);">❌ Gagal: ' + e.message + '</span>';
        }
    },

    // --- Sync Actions ---
    handleSyncNow: async function() {
        window.Utils.showToast('🔄 Syncing...', 'info');
        var result = await window.SyncEngine.sync();
        if (result.success) {
            window.Utils.showToast('✅ Sync berhasil! Pulled: ' + (result.log.pulled || 0) + ', Pushed: ' + (result.log.pushed || 0), 'success');
        } else {
            window.Utils.showToast('❌ Sync gagal: ' + result.message, 'danger');
        }
        this.render();
    },

    handleForcePush: function() {
        window.Utils.showConfirm({
            title: '⬆️ Force Push',
            message: 'Force Push akan menimpa SEMUA data di Google Sheets dengan data lokal. Data di cloud akan DIHAPUS dan diganti data dari HP ini. Lanjutkan?',
            confirmText: 'Push Sekarang',
            cancelText: 'Batal',
            type: 'danger',
            onConfirm: async function() {
                try {
                    window.Utils.showToast('⬆️ Pushing...', 'info');
                    await window.SyncEngine.pushAllToCloud();
                    window.Utils.showToast('✅ Force push berhasil!', 'success');
                    Settings.render();
                } catch (e) {
                    window.Utils.showToast('❌ Force push gagal: ' + e.message, 'danger');
                }
            }
        });
    },

    handleForcePull: function() {
        window.Utils.showConfirm({
            title: '⬇️ Force Pull',
            message: 'Force Pull akan menimpa SEMUA data lokal dengan data dari Google Sheets. Data di HP ini akan DIHAPUS dan diganti data dari cloud. Lanjutkan?',
            confirmText: 'Pull Sekarang',
            cancelText: 'Batal',
            type: 'danger',
            onConfirm: async function() {
                try {
                    window.Utils.showToast('⬇️ Pulling...', 'info');
                    await window.SyncEngine.pullAllFromCloud();
                    window.Utils.showToast('✅ Force pull berhasil!', 'success');
                    Settings.render();
                } catch (e) {
                    window.Utils.showToast('❌ Force pull gagal: ' + e.message, 'danger');
                }
            }
        });
    },

    // --- Export ---
    exportJSON: function() {
        try {
            var data = { stores: window.DB.getAllStores(true), packages: window.DB.getAllPackages(true), trips: window.DB.getAllTrips(true), exportDate: new Date().toISOString() };
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'paket_backup_' + Date.now() + '.json';
            a.click();
            URL.revokeObjectURL(url);
            window.Utils.showToast('📤 JSON exported!', 'success');
            if (window.AuditLog) window.AuditLog.log('EXPORT_DATA', 'settings', { format: 'JSON' });
        } catch (e) { window.Utils.showToast('❌ Export gagal', 'danger'); }
    },

    exportCSV: function() {
        try {
            var pkgs = window.DB.getAllPackages();
            var stores = window.DB.getAllStores();
            var storeMap = {};
            stores.forEach(function(s) { storeMap[s.kode_toko] = s.kode_toko || s.nama_toko || ''; });

            var rows = [['Nama', 'AWB', 'PIN', 'Toko', 'Status', 'Tanggal Masuk', 'Deadline', 'Urgent'].join(',')];
            pkgs.forEach(function(p) {
                if (p._deleted) return;
                rows.push([
                    '"' + (p.nama || '').replace(/"/g, '""') + '"',
                    '"' + (p.nomor_awb || '') + '"',
                    '"' + (p.pin || '') + '"',
                    '"' + (storeMap[p.store_id] || '') + '"',
                    '"' + (p.status || '') + '"',
                    '"' + (p.tanggal_masuk || '') + '"',
                    '"' + (p.deadline || '') + '"',
                    '"' + (p.urgent ? 'Ya' : 'Tidak') + '"'
                ].join(','));
            });

            var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'paket_packages_' + Date.now() + '.csv';
            a.click();
            URL.revokeObjectURL(url);
            window.Utils.showToast('📤 CSV exported!', 'success');
            if (window.AuditLog) window.AuditLog.log('EXPORT_DATA', 'settings', { format: 'CSV' });
        } catch (e) { window.Utils.showToast('❌ Export CSV gagal', 'danger'); }
    },

    // --- Import ---
    importJSON: function(event) {
        var file = event.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (!data.stores && !data.packages) {
                    window.Utils.showToast('❌ Format file tidak sesuai', 'warning');
                    return;
                }
                // Use sync confirm via callback
                window.Utils.showConfirm({
                    title: '📥 Import Data',
                    message: 'Import data akan menimpa data saat ini. Lanjutkan?',
                    confirmText: 'Import',
                    cancelText: 'Batal',
                    type: 'danger',
                    onConfirm: function() {
                        window.DB.importAll(e.target.result);
                        window.Utils.showToast('✅ Data berhasil di-import!', 'success');
                        if (window.AuditLog) window.AuditLog.log('IMPORT_DATA', 'settings', { format: 'JSON' });
                        Settings.render();
                    }
                });
                return;
            } catch (err) {
                window.Utils.showToast('❌ Gagal membaca file JSON', 'danger');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    importCSV: function(event) {
        var file = event.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var lines = e.target.result.split('\n').filter(function(l) { return l.trim(); });
                if (lines.length < 2) { window.Utils.showToast('❌ File CSV kosong', 'warning'); return; }

                var count = 0;
                for (var i = 1; i < lines.length; i++) {
                    var cols = Settings._parseCSVLine(lines[i]);
                    if (cols.length >= 3) {
                        window.DB.createPackage({
                            nama: cols[0] || '', nomor_awb: cols[1] || '', pin: cols[2] || '',
                            store_id: '', status: 'pending',
                            tanggal_masuk: cols[5] || new Date().toISOString().split('T')[0],
                            deadline: cols[6] || '',
                            is_urgent: (cols[7] || '').toLowerCase() === 'ya'
                        });
                        count++;
                    }
                }
                window.Utils.showToast('✅ ' + count + ' paket di-import dari CSV!', 'success');
                if (window.AuditLog) window.AuditLog.log('IMPORT_DATA', 'settings', { format: 'CSV', count: count });
                Settings.render();
            } catch (err) { window.Utils.showToast('❌ Gagal membaca CSV', 'danger'); }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    _parseCSVLine: function(line) {
        var result = []; var current = ''; var inQuote = false;
        for (var i = 0; i < line.length; i++) {
            var c = line[i];
            if (c === '"') { inQuote = !inQuote; }
            else if (c === ',' && !inQuote) { result.push(current.trim()); current = ''; }
            else { current += c; }
        }
        result.push(current.trim());
        return result;
    },

    // --- Danger Zone ---
    clearLocalData: function() {
        window.Utils.showConfirm({
            title: '🗑️ Hapus Data Lokal',
            message: 'Hapus SEMUA data lokal? Tindakan ini tidak bisa dibatalkan! Data di HP ini akan hilang permanen.',
            confirmText: 'Hapus Semua',
            cancelText: 'Batal',
            type: 'danger',
            onConfirm: function() {
                localStorage.removeItem('paket_stores');
                localStorage.removeItem('paket_packages');
                localStorage.removeItem('paket_trips');
                window.Utils.showToast('🗑️ Data lokal dihapus', 'success');
                if (window.AuditLog) window.AuditLog.log('CLEAR_LOCAL', 'settings', { message: 'All local data cleared' });
                Settings.render();
            }
        });
    },

    clearCloudData: function() {
        window.Utils.showConfirm({
            title: '☁️ Hapus Data Cloud',
            message: 'Hapus SEMUA data di Google Sheets? Tindakan ini tidak bisa dibatalkan!',
            confirmText: 'Hapus Cloud',
            cancelText: 'Batal',
            type: 'danger',
            onConfirm: async function() {
                try {
                    await window.SyncEngine.pushToCloud({ stores: [], packages: [], trips: [] });
                    window.Utils.showToast('🗑️ Data cloud dihapus', 'success');
                    if (window.AuditLog) window.AuditLog.log('CLEAR_CLOUD', 'settings', { message: 'All cloud data cleared' });
                } catch (e) { window.Utils.showToast('❌ Gagal hapus cloud: ' + e.message, 'danger'); }
            }
        });
    },

    // --- Helpers ---
    _loadDevices: async function() {
        var el = document.getElementById('settings-devices-list');
        if (!el) return;
        var devices = await window.SyncEngine.getConnectedDevices();
        if (!devices || devices.length === 0) {
            el.innerHTML = '<p style="color:var(--color-text-muted);">Belum ada device terdaftar</p>';
            return;
        }
        var html = '';
        devices.forEach(function(d) {
            var roleIcon = d.role === 'picker' ? '🛵' : d.role === 'admin' ? '🖥️' : '📥';
            var lastSeen = d.last_seen ? Settings._timeAgo(d.last_seen) : 'Unknown';
            html += '<div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--color-surface-2);">' +
                '<span>' + roleIcon + ' ' + (d.device_name || d.device_id) + ' <span style="color:var(--color-text-muted);">(' + (d.role || '') + ')</span></span>' +
                '<span style="color:var(--color-text-muted);">' + lastSeen + '</span></div>';
        });
        el.innerHTML = html;
    },

    _renderSyncLog: function() {
        var logs = window.SyncEngine ? window.SyncEngine.getLogs() : [];
        if (logs.length === 0) return '<p style="color:var(--color-text-muted);">Belum ada log sync</p>';
        var html = '';
        logs.slice(0, 20).forEach(function(log) {
            var icon = log.result === 'success' ? '✅' : log.result === 'error' ? '❌' : '📌';
            var time = log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '';
            var detail = log.error || ('↓' + (log.pulled || 0) + ' ↑' + (log.pushed || 0));
            html += '<div style="padding:0.3rem 0;border-bottom:1px solid var(--color-surface-2);">' +
                '<span>' + icon + ' ' + time + '</span><br>' +
                '<span style="color:var(--color-text-muted);">' + detail + '</span></div>';
        });
        return html;
    },

    _timeAgo: function(dateStr) {
        var now = new Date(); var then = new Date(dateStr);
        var diff = Math.floor((now - then) / 1000);
        if (diff < 60) return diff + ' detik lalu';
        if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
        if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
        return Math.floor(diff / 86400) + ' hari lalu';
    }
};

window.Settings = Settings;
