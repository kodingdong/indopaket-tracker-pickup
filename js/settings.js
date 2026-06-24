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

    handleForcePush: async function() {
        if (!confirm('⬆️ Force Push akan menimpa SEMUA data di Google Sheets dengan data lokal. Lanjutkan?')) return;
        if (!confirm('⚠️ Yakin? Data di cloud akan DIHAPUS dan diganti data dari HP ini.')) return;
        try {
            window.Utils.showToast('⬆️ Pushing...', 'info');
            await window.SyncEngine.pushAllToCloud();
            window.Utils.showToast('✅ Force push berhasil!', 'success');
            this.render();
        } catch (e) {
            window.Utils.showToast('❌ Force push gagal: ' + e.message, 'danger');
        }
    },

    handleForcePull: async function() {
        if (!confirm('⬇️ Force Pull akan menimpa SEMUA data lokal dengan data dari Google Sheets. Lanjutkan?')) return;
        if (!confirm('⚠️ Yakin? Data di HP ini akan DIHAPUS dan diganti data dari cloud.')) return;
        try {
            window.Utils.showToast('⬇️ Pulling...', 'info');
            await window.SyncEngine.pullAllFromCloud();
            window.Utils.showToast('✅ Force pull berhasil!', 'success');
            this.render();
        } catch (e) {
            window.Utils.showToast('❌ Force pull gagal: ' + e.message, 'danger');
        }
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
                if (!confirm('Import data akan menimpa data saat ini. Lanjutkan?')) return;
                window.DB.importAll(e.target.result);
                window.Utils.showToast('✅ Data berhasil di-import!', 'success');
                if (window.AuditLog) window.AuditLog.log('IMPORT_DATA', 'settings', { format: 'JSON' });
                Settings.render();
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
        if (!confirm('🗑️ Hapus SEMUA data lokal? Tindakan ini tidak bisa dibatalkan!')) return;
        if (!confirm('⚠️ TERAKHIR KALI — yakin hapus semua data?')) return;
        localStorage.removeItem('paket_stores');
        localStorage.removeItem('paket_packages');
        localStorage.removeItem('paket_trips');
        window.Utils.showToast('🗑️ Data lokal dihapus', 'success');
        if (window.AuditLog) window.AuditLog.log('CLEAR_LOCAL', 'settings', { message: 'All local data cleared' });
        this.render();
    },

    clearCloudData: async function() {
        if (!confirm('🗑️ Hapus SEMUA data di Google Sheets?')) return;
        if (!confirm('⚠️ TERAKHIR KALI — yakin hapus semua data cloud?')) return;
        try {
            await window.SyncEngine.pushToCloud({ stores: [], packages: [], trips: [] });
            window.Utils.showToast('🗑️ Data cloud dihapus', 'success');
            if (window.AuditLog) window.AuditLog.log('CLEAR_CLOUD', 'settings', { message: 'All cloud data cleared' });
        } catch (e) { window.Utils.showToast('❌ Gagal hapus cloud: ' + e.message, 'danger'); }
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
