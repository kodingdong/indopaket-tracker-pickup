// js/admin.js — Admin Dashboard (Desktop/Laptop read-only view for all data + audit log)

const Admin = {
    currentTab: 'overview',
    logFilters: {},

    render: function() {
        const container = document.getElementById('view-admin');
        if (!container) return;

        const stats = window.DB.getStats();
        const allPkgs = window.DB.getAllPackages().filter(p => !p._deleted);
        const allStores = window.DB.getAllStores().filter(s => !s._deleted);
        const allTrips = window.DB.getAllTrips().filter(t => !t._deleted);

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:0.5rem;">
                <h2 style="font-size:1.5rem;margin:0;">🖥️ Admin Panel</h2>
                <span class="badge" style="background:rgba(108,99,255,0.2);color:var(--color-primary);font-size:0.8rem;padding:0.4rem 0.8rem;">Read-Only View</span>
            </div>

            <!-- Tab Navigation -->
            <div style="display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;margin-bottom:1.5rem;scrollbar-width:none;">
                ${this._renderTab('overview', '📊 Overview')}
                ${this._renderTab('packages', '📦 Paket (' + allPkgs.length + ')')}
                ${this._renderTab('stores', '🏪 Toko (' + allStores.length + ')')}
                ${this._renderTab('trips', '🛵 Trip (' + allTrips.length + ')')}
                ${this._renderTab('audit', '📋 Audit Log')}
            </div>

            <div id="admin-tab-content"></div>
        `;

        this._renderTabContent();
    },

    _renderTab: function(id, label) {
        const isActive = this.currentTab === id;
        return '<button class="badge" style="border:none;cursor:pointer;padding:0.5rem 1rem;border-radius:16px;white-space:nowrap;' +
            'background-color:' + (isActive ? 'var(--color-primary)' : 'var(--color-surface-2)') + ';' +
            'color:' + (isActive ? '#fff' : 'var(--color-text-muted)') + ';" ' +
            'onclick="Admin.switchTab(\'' + id + '\')">' + label + '</button>';
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        this.render();
    },

    _renderTabContent: function() {
        const container = document.getElementById('admin-tab-content');
        if (!container) return;

        switch (this.currentTab) {
            case 'overview': container.innerHTML = this._renderOverview(); break;
            case 'packages': container.innerHTML = this._renderPackages(); break;
            case 'stores': container.innerHTML = this._renderStores(); break;
            case 'trips': container.innerHTML = this._renderTrips(); break;
            case 'audit': container.innerHTML = this._renderAuditLog(); break;
        }
    },

    // --- Overview Tab ---
    _renderOverview: function() {
        const stats = window.DB.getStats();
        const allPkgs = window.DB.getAllPackages().filter(p => !p._deleted);
        const allStores = window.DB.getAllStores().filter(s => !s._deleted);
        const allTrips = window.DB.getAllTrips().filter(t => !t._deleted);
        const recentLogs = window.AuditLog ? window.AuditLog.query({}).slice(0, 10) : [];

        return `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;margin-bottom:1.5rem;">
                <div class="card glassmorphism" style="text-align:center;padding:1rem;">
                    <div style="font-size:2rem;font-weight:700;color:var(--color-primary);">${allPkgs.length}</div>
                    <div style="font-size:0.8rem;color:var(--color-text-muted);">Total Paket</div>
                </div>
                <div class="card glassmorphism" style="text-align:center;padding:1rem;">
                    <div style="font-size:2rem;font-weight:700;color:var(--color-warning);">${stats.pendingCount}</div>
                    <div style="font-size:0.8rem;color:var(--color-text-muted);">Pending</div>
                </div>
                <div class="card glassmorphism" style="text-align:center;padding:1rem;">
                    <div style="font-size:2rem;font-weight:700;color:var(--color-success);">${stats.pickedCount}</div>
                    <div style="font-size:0.8rem;color:var(--color-text-muted);">Diambil</div>
                </div>
                <div class="card glassmorphism" style="text-align:center;padding:1rem;">
                    <div style="font-size:2rem;font-weight:700;color:var(--color-urgent);">${stats.urgentCount}</div>
                    <div style="font-size:0.8rem;color:var(--color-text-muted);">Urgent</div>
                </div>
                <div class="card glassmorphism" style="text-align:center;padding:1rem;">
                    <div style="font-size:2rem;font-weight:700;color:var(--color-text);">${allStores.length}</div>
                    <div style="font-size:0.8rem;color:var(--color-text-muted);">Toko</div>
                </div>
                <div class="card glassmorphism" style="text-align:center;padding:1rem;">
                    <div style="font-size:2rem;font-weight:700;color:var(--color-text);">${allTrips.length}</div>
                    <div style="font-size:0.8rem;color:var(--color-text-muted);">Total Trip</div>
                </div>
            </div>

            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;margin-bottom:1rem;">📋 Aktivitas Terbaru</h3>
                ${this._renderLogEntries(recentLogs)}
            </div>
        `;
    },

    // --- Packages Tab (Table View) ---
    _renderPackages: function() {
        const allPkgs = window.DB.getAllPackages().filter(p => !p._deleted);
        const stores = window.DB.getAllStores();
        const storeMap = {};
        stores.forEach(s => storeMap[s.kode_toko] = s);

        let rows = '';
        allPkgs.forEach(function(p) {
            const store = storeMap[p.store_id];
            const storeName = store ? store.kode_toko : '-';
            const statusBadge = p.status === 'picked_up' ? '<span class="badge badge-success">Diambil</span>' :
                p.status === 'returned' ? '<span class="badge badge-danger">Retur</span>' :
                '<span class="badge badge-warning">Pending</span>';
            const deadline = p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID') : '-';
            const masuk = p.tanggal_masuk ? new Date(p.tanggal_masuk).toLocaleDateString('id-ID') : '-';

            rows += '<tr style="border-bottom:1px solid var(--color-surface-2);">' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;">' + window.Utils.escapeHtml(p.nama || '-') + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;font-family:monospace;">' + window.Utils.escapeHtml(p.nomor_awb || '-') + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;font-weight:600;">' + window.Utils.escapeHtml(p.pin || '-') + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;">' + window.Utils.escapeHtml(storeName) + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;">' + statusBadge + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;">' + masuk + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;">' + deadline + '</td>' +
                '</tr>';
        });

        return `
            <div class="card glassmorphism" style="overflow-x:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h3 style="margin:0;font-size:1.1rem;">📦 Semua Paket</h3>
                    <span class="badge" style="background:var(--color-surface-2);color:var(--color-text-muted);">${allPkgs.length} data</span>
                </div>
                <table style="width:100%;border-collapse:collapse;min-width:600px;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--color-primary);">
                            <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Nama</th>
                            <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">AWB</th>
                            <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">PIN</th>
                            <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Toko</th>
                            <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Status</th>
                            <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Masuk</th>
                            <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Deadline</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Tidak ada data</td></tr>'}</tbody>
                </table>
            </div>
        `;
    },

    // --- Stores Tab ---
    _renderStores: function() {
        const stores = window.DB.getAllStores().filter(s => !s._deleted);
        let rows = '';
        stores.forEach(function(s) {
            const pkgs = window.DB.getPackagesByStore(s.kode_toko);
            const pending = pkgs.filter(p => p.status === 'pending').length;
            const total = pkgs.filter(p => !p._deleted).length;
            rows += '<tr style="border-bottom:1px solid var(--color-surface-2);">' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.85rem;font-weight:600;">' + s.kode_toko + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.85rem;">' + s.nama_toko + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.85rem;">' + (s.alamat || '-') + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.85rem;text-align:center;">' + total + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.85rem;text-align:center;">' +
                    (pending > 0 ? '<span class="badge badge-warning">' + pending + '</span>' : '<span class="badge badge-success">0</span>') +
                '</td></tr>';
        });

        return `
            <div class="card glassmorphism" style="overflow-x:auto;">
                <h3 style="margin-top:0;font-size:1.1rem;margin-bottom:1rem;">🏪 Semua Toko</h3>
                <table style="width:100%;border-collapse:collapse;min-width:500px;">
                    <thead><tr style="border-bottom:2px solid var(--color-primary);">
                        <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Kode</th>
                        <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Nama</th>
                        <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Alamat</th>
                        <th style="padding:0.6rem 0.5rem;text-align:center;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Total</th>
                        <th style="padding:0.6rem 0.5rem;text-align:center;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Pending</th>
                    </tr></thead>
                    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Tidak ada data</td></tr>'}</tbody>
                </table>
            </div>
        `;
    },

    // --- Trips Tab ---
    _renderTrips: function() {
        const trips = window.DB.getAllTrips().filter(t => !t._deleted);
        let rows = '';
        trips.forEach(function(t) {
            const pkgCount = (t.packages || []).length;
            const statusBadge = t.status === 'completed' ? '<span class="badge badge-success">Selesai</span>' : '<span class="badge badge-warning">Aktif</span>';
            const created = t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-';
            const completed = t.completed_at ? new Date(t.completed_at).toLocaleString('id-ID') : '-';
            rows += '<tr style="border-bottom:1px solid var(--color-surface-2);">' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;font-family:monospace;">' + (t.id || '-').substring(0, 10) + '…</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.85rem;">' + statusBadge + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.85rem;text-align:center;">' + pkgCount + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;">' + created + '</td>' +
                '<td style="padding:0.6rem 0.5rem;font-size:0.8rem;">' + completed + '</td>' +
                '</tr>';
        });

        return `
            <div class="card glassmorphism" style="overflow-x:auto;">
                <h3 style="margin-top:0;font-size:1.1rem;margin-bottom:1rem;">🛵 Semua Trip</h3>
                <table style="width:100%;border-collapse:collapse;min-width:500px;">
                    <thead><tr style="border-bottom:2px solid var(--color-primary);">
                        <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">ID</th>
                        <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Status</th>
                        <th style="padding:0.6rem 0.5rem;text-align:center;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Paket</th>
                        <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Dibuat</th>
                        <th style="padding:0.6rem 0.5rem;text-align:left;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;">Selesai</th>
                    </tr></thead>
                    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Tidak ada data</td></tr>'}</tbody>
                </table>
            </div>
        `;
    },

    // --- Audit Log Tab ---
    _renderAuditLog: function() {
        const logs = window.AuditLog ? window.AuditLog.query(this.logFilters) : [];

        return `
            <div class="card glassmorphism" style="margin-bottom:1rem;">
                <h3 style="margin-top:0;font-size:1.1rem;margin-bottom:1rem;">🔍 Filter Log</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.75rem;margin-bottom:1rem;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.8rem;">Aksi</label>
                        <select class="input" id="admin-filter-action" style="width:100%;padding:0.5rem;border-radius:var(--radius);border:1px solid var(--color-surface-2);background:var(--color-bg);color:var(--color-text);font-family:var(--font-main);" onchange="Admin.applyLogFilter()">
                            <option value="">Semua Aksi</option>
                            <option value="CREATE_PACKAGE">Tambah Paket</option>
                            <option value="UPDATE_PACKAGE">Update Paket</option>
                            <option value="DELETE_PACKAGE">Hapus Paket</option>
                            <option value="PICKUP_PACKAGE">Pickup Paket</option>
                            <option value="CREATE_STORE">Tambah Toko</option>
                            <option value="UPDATE_STORE">Update Toko</option>
                            <option value="DELETE_STORE">Hapus Toko</option>
                            <option value="CREATE_TRIP">Mulai Trip</option>
                            <option value="COMPLETE_TRIP">Selesai Trip</option>
                            <option value="SYNC_PUSH">Sync Push</option>
                            <option value="SYNC_PULL">Sync Pull</option>
                            <option value="CONFIG_CHANGE">Config Change</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.8rem;">Dari Tanggal</label>
                        <input type="date" id="admin-filter-from" style="width:100%;padding:0.5rem;border-radius:var(--radius);border:1px solid var(--color-surface-2);background:var(--color-bg);color:var(--color-text);" onchange="Admin.applyLogFilter()">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.8rem;">Sampai Tanggal</label>
                        <input type="date" id="admin-filter-to" style="width:100%;padding:0.5rem;border-radius:var(--radius);border:1px solid var(--color-surface-2);background:var(--color-bg);color:var(--color-text);" onchange="Admin.applyLogFilter()">
                    </div>
                </div>
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn" style="flex:1;background:var(--color-surface-2);color:white;padding:0.5rem;" onclick="Admin.resetLogFilter()">Reset Filter</button>
                    <button class="btn" style="flex:1;background:var(--color-surface-2);color:white;padding:0.5rem;" onclick="if(window.AuditLog)window.AuditLog.exportLogsCSV()">📤 Export CSV</button>
                    <button class="btn" style="flex:1;background:var(--color-surface-2);color:white;padding:0.5rem;" onclick="if(window.AuditLog)window.AuditLog.exportLogs()">📤 Export JSON</button>
                </div>
            </div>

            <div class="card glassmorphism">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h3 style="margin:0;font-size:1.1rem;">📋 Log Aktivitas</h3>
                    <span class="badge" style="background:var(--color-surface-2);color:var(--color-text-muted);">${logs.length} entries</span>
                </div>
                <div style="max-height:500px;overflow-y:auto;">
                    ${this._renderLogEntries(logs)}
                </div>
            </div>
        `;
    },

    _renderLogEntries: function(logs) {
        if (!logs || logs.length === 0) {
            return '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">Belum ada log aktivitas</p>';
        }

        var html = '';
        logs.forEach(function(l) {
            var label = window.AuditLog ? window.AuditLog.getActionLabel(l.action) : l.action;
            var color = window.AuditLog ? window.AuditLog.getActionColor(l.action) : 'var(--color-text-muted)';
            var time = l.timestamp ? new Date(l.timestamp).toLocaleString('id-ID') : '';
            var detailStr = '';
            if (l.details) {
                if (l.details.nama) detailStr += l.details.nama;
                if (l.details.kode_toko) detailStr += (detailStr ? ' | ' : '') + l.details.kode_toko;
                if (l.details.nama_toko) detailStr += (detailStr ? ' - ' : '') + l.details.nama_toko;
                if (l.details.count) detailStr += (detailStr ? ' | ' : '') + l.details.count + ' item';
                if (l.details.message) detailStr += (detailStr ? ' | ' : '') + l.details.message;
            }
            html += '<div style="padding:0.75rem;border-bottom:1px solid var(--color-surface-2);display:flex;gap:0.75rem;align-items:flex-start;">' +
                '<div style="width:4px;min-height:40px;border-radius:2px;background:' + color + ';flex-shrink:0;margin-top:2px;"></div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.25rem;">' +
                        '<span style="font-size:0.85rem;font-weight:600;">' + label + '</span>' +
                        '<span style="font-size:0.7rem;color:var(--color-text-muted);">' + time + '</span>' +
                    '</div>' +
                    (detailStr ? '<p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + detailStr + '</p>' : '') +
                    '<div style="display:flex;gap:0.5rem;margin-top:0.25rem;">' +
                        '<span style="font-size:0.65rem;color:var(--color-text-muted);background:var(--color-surface-2);padding:0.1rem 0.4rem;border-radius:4px;">' + (l.device_name || 'Unknown') + '</span>' +
                        '<span style="font-size:0.65rem;color:var(--color-text-muted);background:var(--color-surface-2);padding:0.1rem 0.4rem;border-radius:4px;">' + (l.device_role || '') + '</span>' +
                    '</div>' +
                '</div></div>';
        });
        return html;
    },

    applyLogFilter: function() {
        var action = document.getElementById('admin-filter-action');
        var from = document.getElementById('admin-filter-from');
        var to = document.getElementById('admin-filter-to');
        this.logFilters = {};
        if (action && action.value) this.logFilters.action = action.value;
        if (from && from.value) this.logFilters.dateFrom = from.value;
        if (to && to.value) this.logFilters.dateTo = to.value;
        var content = document.getElementById('admin-tab-content');
        if (content) content.innerHTML = this._renderAuditLog();
    },

    resetLogFilter: function() {
        this.logFilters = {};
        var content = document.getElementById('admin-tab-content');
        if (content) content.innerHTML = this._renderAuditLog();
    }
};

window.Admin = Admin;
