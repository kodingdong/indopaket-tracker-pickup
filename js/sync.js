// js/sync.js — Hybrid Sync Engine (LocalStorage ↔ Google Sheets)

const SyncEngine = {
    CONFIG_KEY: 'indopaket_sync_config',
    SYNC_LOG_KEY: 'indopaket_sync_log',
    DEVICE_ID_KEY: 'indopaket_device_id',

    _intervalId: null,
    _syncing: false,

    // ================================================================
    // Device ID
    // ================================================================
    getDeviceId: function() {
        var id = localStorage.getItem(this.DEVICE_ID_KEY);
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substring(2, 10);
            localStorage.setItem(this.DEVICE_ID_KEY, id);
        }
        return id;
    },

    // ================================================================
    // Config Management
    // ================================================================
    getConfig: function() {
        try {
            var raw = localStorage.getItem(this.CONFIG_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return {
            scriptUrl: '',
            deviceName: '',
            role: 'input',
            mode: 'off',           // 'off' | 'manual' | 'auto'
            autoIntervalMin: 5,
            lastSync: null
        };
    },

    saveConfig: function(config) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    },

    isConfigured: function() {
        var cfg = this.getConfig();
        return cfg.scriptUrl && cfg.scriptUrl.length > 0;
    },

    // ================================================================
    // Connection Test
    // ================================================================
    testConnection: async function(scriptUrl) {
        try {
            var url = scriptUrl + '?action=ping';
            var resp = await fetch(url, { method: 'GET', redirect: 'follow' });
            var data = await resp.json();
            if (data && data.status === 'ok') {
                return { success: true, message: 'Terhubung! Server time: ' + data.timestamp };
            }
            return { success: false, message: 'Response tidak valid: ' + JSON.stringify(data) };
        } catch (e) {
            return { success: false, message: 'Gagal terhubung: ' + e.message };
        }
    },

    // ================================================================
    // Device Registration
    // ================================================================
    registerDevice: async function() {
        var cfg = this.getConfig();
        if (!cfg.scriptUrl) return { success: false, message: 'Script URL belum dikonfigurasi' };

        try {
            var payload = {
                action: 'registerDevice',
                device_id: this.getDeviceId(),
                device_name: cfg.deviceName || 'Unknown Device',
                role: cfg.role || 'input'
            };
            var resp = await fetch(cfg.scriptUrl, {
                method: 'POST',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });
            var data = await resp.json();
            return data;
        } catch (e) {
            return { success: false, message: 'Registrasi gagal: ' + e.message };
        }
    },

    getConnectedDevices: async function() {
        var cfg = this.getConfig();
        if (!cfg.scriptUrl) return [];

        try {
            var resp = await fetch(cfg.scriptUrl + '?action=getDevices', { redirect: 'follow' });
            var data = await resp.json();
            return data.data || [];
        } catch (e) {
            return [];
        }
    },

    // ================================================================
    // Core Sync
    // ================================================================
    sync: async function() {
        if (this._syncing) {
            return { success: false, message: 'Sync sedang berjalan' };
        }

        var cfg = this.getConfig();
        if (!cfg.scriptUrl) {
            return { success: false, message: 'Sync belum dikonfigurasi' };
        }
        if (cfg.mode === 'off') {
            return { success: false, message: 'Sync mode OFF' };
        }
        if (!navigator.onLine) {
            return { success: false, message: 'Tidak ada koneksi internet' };
        }

        this._syncing = true;
        this._dispatchEvent('sync-start');

        try {
            // 1. Pull cloud data
            var cloudResult = await this.pullFromCloud(cfg.lastSync);
            if (cloudResult.error) {
                throw new Error('Pull failed: ' + cloudResult.error);
            }

            // 2. Get local data
            var localData = {
                stores: window.DB.getAllStores(),
                packages: window.DB.getAllPackages(),
                trips: window.DB.getAllTrips()
            };

            // 3. Merge
            var cloudData = {
                stores: (cloudResult.stores && cloudResult.stores.data) || [],
                packages: (cloudResult.packages && cloudResult.packages.data) || [],
                trips: (cloudResult.trips && cloudResult.trips.data) || []
            };

            var merged = this.mergeData(localData, cloudData);

            // 4. Update local with merged data
            if (merged.pullToLocal.stores.length > 0 ||
                merged.pullToLocal.packages.length > 0 ||
                merged.pullToLocal.trips.length > 0) {
                this._applyToLocal(merged.pullToLocal);
            }

            // 5. Push changes to cloud
            if (merged.pushToCloud.stores.length > 0 ||
                merged.pushToCloud.packages.length > 0 ||
                merged.pushToCloud.trips.length > 0) {
                await this.pushToCloud(merged.pushToCloud);
            }

            // 6. Mark all as synced
            window.DB.markAllAsSynced();

            // 7. Update lastSync
            var now = new Date().toISOString();
            cfg.lastSync = now;
            this.saveConfig(cfg);

            // 8. Log
            var logEntry = {
                timestamp: now,
                result: 'success',
                device: this.getDeviceId(),
                pulled: merged.pullToLocal.stores.length + merged.pullToLocal.packages.length + merged.pullToLocal.trips.length,
                pushed: merged.pushToCloud.stores.length + merged.pushToCloud.packages.length + merged.pushToCloud.trips.length,
                conflicts: merged.conflicts.length
            };
            this.addLog(logEntry);

            this._syncing = false;
            this._dispatchEvent('sync-complete', { success: true, log: logEntry });

            return { success: true, log: logEntry };

        } catch (e) {
            this._syncing = false;
            var errorLog = {
                timestamp: new Date().toISOString(),
                result: 'error',
                device: this.getDeviceId(),
                error: e.message
            };
            this.addLog(errorLog);
            this._dispatchEvent('sync-complete', { success: false, error: e.message });

            return { success: false, message: e.message };
        }
    },

    // ================================================================
    // Pull / Push
    // ================================================================
    pullFromCloud: async function(since) {
        var cfg = this.getConfig();
        var url = cfg.scriptUrl + '?action=getAll';
        if (since) url += '&since=' + encodeURIComponent(since);

        var resp = await fetch(url, { redirect: 'follow' });
        return await resp.json();
    },

    pushToCloud: async function(data) {
        var cfg = this.getConfig();
        var payload = {
            action: 'batchUpdate',
            device_id: this.getDeviceId(),
            data: data
        };
        var resp = await fetch(cfg.scriptUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        return await resp.json();
    },

    // ================================================================
    // Full Overwrite Operations
    // ================================================================
    pushAllToCloud: async function() {
        var cfg = this.getConfig();
        if (!cfg.scriptUrl) throw new Error('Not configured');

        var data = {
            stores: window.DB.getAllStores(),
            packages: window.DB.getAllPackages(),
            trips: window.DB.getAllTrips()
        };

        var payload = {
            action: 'fullSync',
            device_id: this.getDeviceId(),
            data: data
        };

        var resp = await fetch(cfg.scriptUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        var result = await resp.json();

        if (result.success) {
            var now = new Date().toISOString();
            cfg.lastSync = now;
            this.saveConfig(cfg);
            window.DB.markAllAsSynced();
            this.addLog({
                timestamp: now, result: 'force_push', device: this.getDeviceId(),
                message: 'Force pushed all data to cloud'
            });
        }

        return result;
    },

    pullAllFromCloud: async function() {
        var cfg = this.getConfig();
        if (!cfg.scriptUrl) throw new Error('Not configured');

        var resp = await fetch(cfg.scriptUrl + '?action=getAll', { redirect: 'follow' });
        var cloudData = await resp.json();

        var stores = (cloudData.stores && cloudData.stores.data) || [];
        var packages = (cloudData.packages && cloudData.packages.data) || [];
        var trips = (cloudData.trips && cloudData.trips.data) || [];

        // Overwrite local
        window.DB._save(window.DB_KEYS.STORES, stores);
        window.DB._save(window.DB_KEYS.PACKAGES, packages);
        window.DB._save(window.DB_KEYS.TRIPS, trips);

        var now = new Date().toISOString();
        cfg.lastSync = now;
        this.saveConfig(cfg);

        this.addLog({
            timestamp: now, result: 'force_pull', device: this.getDeviceId(),
            message: 'Force pulled all data from cloud. Stores: ' + stores.length +
                     ', Packages: ' + packages.length + ', Trips: ' + trips.length
        });

        this._dispatchEvent('sync-complete', { success: true, forcePull: true });

        return {
            success: true,
            counts: { stores: stores.length, packages: packages.length, trips: trips.length }
        };
    },

    // ================================================================
    // Merge Logic (Timestamp-Based Last-Write-Wins)
    // ================================================================
    mergeData: function(localData, cloudData) {
        var result = {
            pullToLocal: { stores: [], packages: [], trips: [] },
            pushToCloud: { stores: [], packages: [], trips: [] },
            conflicts: []
        };

        var entityTypes = ['stores', 'packages', 'trips'];

        for (var t = 0; t < entityTypes.length; t++) {
            var type = entityTypes[t];
            var localItems = localData[type] || [];
            var cloudItems = cloudData[type] || [];

            var merged = this._mergeEntityList(localItems, cloudItems, type);
            result.pullToLocal[type] = merged.pullToLocal;
            result.pushToCloud[type] = merged.pushToCloud;
            result.conflicts = result.conflicts.concat(merged.conflicts);
        }

        return result;
    },

    _mergeEntityList: function(localItems, cloudItems, entityType) {
        var pullToLocal = [];
        var pushToCloud = [];
        var conflicts = [];

        // Build maps by ID
        var localMap = {};
        var cloudMap = {};

        for (var i = 0; i < localItems.length; i++) {
            if (localItems[i].id) localMap[localItems[i].id] = localItems[i];
        }
        for (var i = 0; i < cloudItems.length; i++) {
            if (cloudItems[i].id) cloudMap[cloudItems[i].id] = cloudItems[i];
        }

        // Process all IDs (union of local + cloud)
        var allIds = {};
        for (var id in localMap) allIds[id] = true;
        for (var id in cloudMap) allIds[id] = true;

        for (var id in allIds) {
            var local = localMap[id];
            var cloud = cloudMap[id];

            if (local && !cloud) {
                // Exists only locally → push to cloud
                pushToCloud.push(local);
            } else if (!local && cloud) {
                // Exists only in cloud → pull to local
                pullToLocal.push(cloud);
            } else if (local && cloud) {
                // Exists in both → compare timestamps
                var localTime = local.updated_at ? new Date(local.updated_at).getTime() : 0;
                var cloudTime = cloud.updated_at ? new Date(cloud.updated_at).getTime() : 0;

                if (localTime > cloudTime) {
                    // Local is newer → push to cloud
                    pushToCloud.push(local);
                } else if (cloudTime > localTime) {
                    // Cloud is newer → pull to local
                    pullToLocal.push(cloud);
                }
                // If equal timestamps → no action needed (already in sync)
            }
        }

        return { pullToLocal: pullToLocal, pushToCloud: pushToCloud, conflicts: conflicts };
    },

    _applyToLocal: function(pullData) {
        var types = ['stores', 'packages', 'trips'];
        var keys = [window.DB_KEYS.STORES, window.DB_KEYS.PACKAGES, window.DB_KEYS.TRIPS];

        for (var t = 0; t < types.length; t++) {
            var items = pullData[types[t]];
            if (!items || items.length === 0) continue;

            var existing = window.DB._getAll(keys[t]);
            var existingMap = {};
            for (var i = 0; i < existing.length; i++) {
                if (existing[i].id) existingMap[existing[i].id] = i;
            }

            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (existingMap.hasOwnProperty(item.id)) {
                    // Update existing
                    var idx = existingMap[item.id];
                    existing[idx] = Object.assign({}, existing[idx], item, { _synced: true });
                } else {
                    // Add new
                    item._synced = true;
                    existing.push(item);
                }
            }

            window.DB._save(keys[t], existing);
        }
    },

    // ================================================================
    // Auto Sync
    // ================================================================
    startAutoSync: function(intervalMin) {
        this.stopAutoSync();
        var self = this;
        var ms = (intervalMin || 5) * 60 * 1000;

        this._intervalId = setInterval(function() {
            if (navigator.onLine && !self._syncing) {
                self.sync().catch(function(e) {
                    console.error('Auto-sync error:', e);
                });
            }
        }, ms);

        // Also sync on coming back online
        window.addEventListener('online', this._onlineHandler);
    },

    stopAutoSync: function() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        window.removeEventListener('online', this._onlineHandler);
    },

    _onlineHandler: function() {
        var cfg = SyncEngine.getConfig();
        if (cfg.mode === 'auto' && !SyncEngine._syncing) {
            SyncEngine.sync().catch(function(e) {
                console.error('Online-sync error:', e);
            });
        }
    },

    // ================================================================
    // Init — called from App.init()
    // ================================================================
    init: function() {
        var cfg = this.getConfig();
        if (cfg.mode === 'auto' && cfg.scriptUrl) {
            this.startAutoSync(cfg.autoIntervalMin);
        }
    },

    // ================================================================
    // Sync Status & Logging
    // ================================================================
    getSyncStatus: function() {
        var cfg = this.getConfig();
        var logs = this.getLogs();
        var lastLog = logs.length > 0 ? logs[0] : null;

        return {
            isConfigured: this.isConfigured(),
            mode: cfg.mode,
            lastSync: cfg.lastSync,
            lastResult: lastLog ? lastLog.result : null,
            isOnline: navigator.onLine,
            isSyncing: this._syncing,
            deviceId: this.getDeviceId(),
            deviceName: cfg.deviceName
        };
    },

    getLogs: function() {
        try {
            var raw = localStorage.getItem(this.SYNC_LOG_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    addLog: function(entry) {
        var logs = this.getLogs();
        logs.unshift(entry); // Add to beginning
        if (logs.length > 50) logs = logs.slice(0, 50); // Keep last 50
        localStorage.setItem(this.SYNC_LOG_KEY, JSON.stringify(logs));
    },

    // ================================================================
    // Event Helpers
    // ================================================================
    _dispatchEvent: function(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    }
};

window.SyncEngine = SyncEngine;
