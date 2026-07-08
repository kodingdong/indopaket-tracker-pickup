// js/audit-log.js — Audit Log System for tracking all user actions

const AuditLog = {
    LOG_KEY: 'paket_audit_logs',
    MAX_LOGS: 500, // Keep last 500 entries to prevent localStorage overflow

    /**
     * Log an action to the audit trail
     * @param {string} action - The action type (e.g., 'CREATE_PACKAGE', 'DELETE_STORE')
     * @param {string} entity - The entity type (e.g., 'package', 'store', 'trip')
     * @param {object} details - Additional details about the action
     */
    log: function(action, entity, details = {}) {
        const logs = this._getAll();
        const cfg = window.SyncEngine ? window.SyncEngine.getConfig() : {};

        const entry = {
            id: window.Utils ? window.Utils.generateId() : Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: action,
            entity: entity,
            details: details,
            device_name: cfg.deviceName || 'Unknown',
            device_role: cfg.role || 'unknown',
            device_id: window.SyncEngine ? window.SyncEngine.getDeviceId() : 'N/A'
        };

        logs.unshift(entry); // Add to beginning (newest first)

        // Trim to max size
        if (logs.length > this.MAX_LOGS) {
            logs.length = this.MAX_LOGS;
        }

        this._save(logs);
        return entry;
    },

    _getAll: function() {
        try {
            const data = localStorage.getItem(this.LOG_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('[AuditLog] Error reading logs', e);
            return [];
        }
    },

    _save: function(logs) {
        try {
            localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
        } catch (e) {
            console.error('[AuditLog] Error saving logs', e);
        }
    },

    /**
     * Get all logs with optional filtering
     * @param {object} filters - { action, entity, dateFrom, dateTo, deviceName }
     * @returns {Array}
     */
    query: function(filters = {}) {
        let logs = this._getAll();

        if (filters.action) {
            logs = logs.filter(l => l.action === filters.action);
        }
        if (filters.entity) {
            logs = logs.filter(l => l.entity === filters.entity);
        }
        if (filters.dateFrom) {
            const from = new Date(filters.dateFrom);
            from.setHours(0, 0, 0, 0);
            logs = logs.filter(l => new Date(l.timestamp) >= from);
        }
        if (filters.dateTo) {
            const to = new Date(filters.dateTo);
            to.setHours(23, 59, 59, 999);
            logs = logs.filter(l => new Date(l.timestamp) <= to);
        }
        if (filters.deviceName) {
            logs = logs.filter(l => l.device_name && l.device_name.toLowerCase().includes(filters.deviceName.toLowerCase()));
        }

        return logs;
    },

    /**
     * Get human-readable description for an action
     */
    getActionLabel: function(action) {
        const labels = {
            'CREATE_PACKAGE': '📦 Paket Ditambahkan',
            'UPDATE_PACKAGE': '✏️ Paket Diupdate',
            'DELETE_PACKAGE': '🗑️ Paket Dihapus',
            'PICKUP_PACKAGE': '✅ Paket Diambil',
            'UNDO_PICKUP': '↩️ Batal Pickup',
            'RETURN_PACKAGE': '🔄 Paket Diretur',
            'CREATE_STORE': '🏪 Toko Ditambahkan',
            'UPDATE_STORE': '✏️ Toko Diupdate',
            'DELETE_STORE': '🗑️ Toko Dihapus',
            'CREATE_TRIP': '🛵 Trip Dimulai',
            'COMPLETE_TRIP': '🏁 Trip Selesai',
            'SYNC_PUSH': '⬆️ Sync Push',
            'SYNC_PULL': '⬇️ Sync Pull',
            'SYNC_AUTO': '🔄 Auto Sync',
            'IMPORT_DATA': '📥 Import Data',
            'EXPORT_DATA': '📤 Export Data',
            'CLEAR_LOCAL': '🗑️ Hapus Data Lokal',
            'CLEAR_CLOUD': '☁️ Hapus Data Cloud',
            'BULK_IMPORT': '📋 Bulk Import',
            'BULK_CREATE': '📋 Bulk Tambah Paket',
            'OCR_IMPORT': '📷 OCR Import',
            'CONFIG_CHANGE': '⚙️ Konfigurasi Diubah'
        };
        return labels[action] || action;
    },

    /**
     * Get action icon color class
     */
    getActionColor: function(action) {
        if (action.includes('CREATE') || action.includes('IMPORT')) return 'var(--color-success)';
        if (action.includes('DELETE') || action.includes('CLEAR')) return 'var(--color-danger)';
        if (action.includes('UPDATE') || action.includes('CONFIG')) return 'var(--color-warning)';
        if (action.includes('PICKUP') || action.includes('COMPLETE')) return 'var(--color-primary)';
        if (action.includes('SYNC')) return '#00bcd4';
        return 'var(--color-text-muted)';
    },

    /**
     * Export logs as JSON
     */
    exportLogs: function() {
        const logs = this._getAll();
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_log_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Export logs as CSV
     */
    exportLogsCSV: function() {
        const logs = this._getAll();
        const rows = [['Timestamp', 'Action', 'Entity', 'Details', 'Device', 'Role'].join(',')];
        logs.forEach(function(l) {
            rows.push([
                '"' + new Date(l.timestamp).toLocaleString('id-ID') + '"',
                '"' + (l.action || '') + '"',
                '"' + (l.entity || '') + '"',
                '"' + JSON.stringify(l.details || {}).replace(/"/g, '""') + '"',
                '"' + (l.device_name || '') + '"',
                '"' + (l.device_role || '') + '"'
            ].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_log_' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Clear all audit logs
     */
    clearLogs: function() {
        this._save([]);
    }
};

window.AuditLog = AuditLog;
