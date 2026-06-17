// js/db.js

const DB_KEYS = {
    STORES: 'indopaket_stores',
    PACKAGES: 'indopaket_packages',
    TRIPS: 'indopaket_trips'
};

const DB = {
    // --- Generic CRUD ---
    _getAll: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return [];
        }
    },

    _save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage', e);
        }
    },

    _getById: function(key, id) {
        const items = this._getAll(key);
        return items.find(item => item.id === id);
    },

    _create: function(key, item) {
        const items = this._getAll(key);
        if (!item.id) {
            item.id = window.Utils ? window.Utils.generateId() : Date.now().toString();
        }
        const now = new Date().toISOString();
        item.created_at = now;
        item.updated_at = now;
        item._deleted = false;
        item._synced = false;
        items.push(item);
        this._save(key, items);
        return item;
    },

    _update: function(key, id, updates) {
        const items = this._getAll(key);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;

        items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString(), _synced: false };
        this._save(key, items);
        return items[index];
    },

    _delete: function(key, id) {
        // Use soft-delete if sync is configured, otherwise hard delete
        if (window.SyncEngine && window.SyncEngine.isConfigured()) {
            return this._softDelete(key, id);
        }
        const items = this._getAll(key);
        const filtered = items.filter(item => item.id !== id);
        this._save(key, filtered);
        return filtered.length !== items.length;
    },

    _softDelete: function(key, id) {
        const items = this._getAll(key);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return false;
        items[index]._deleted = true;
        items[index].updated_at = new Date().toISOString();
        items[index]._synced = false;
        this._save(key, items);
        return true;
    },

    // --- Store CRUD ---
    getAllStores: function() {
        return this._getAll(DB_KEYS.STORES);
    },
    
    getStoreByKode: function(kode_toko) {
        const stores = this.getAllStores();
        return stores.find(s => s.kode_toko === kode_toko);
    },

    createStore: function(storeData) {
        return this._create(DB_KEYS.STORES, storeData);
    },

    updateStore: function(id, updates) {
        return this._update(DB_KEYS.STORES, id, updates);
    },

    deleteStore: function(id) {
        return this._delete(DB_KEYS.STORES, id);
    },

    // --- Package CRUD ---
    getAllPackages: function() {
        return this._getAll(DB_KEYS.PACKAGES);
    },

    getPackagesByStore: function(storeId) {
        const pkgs = this.getAllPackages();
        return pkgs.filter(p => p.store_id === storeId);
    },

    getPackagesByStatus: function(status) {
        const pkgs = this.getAllPackages();
        return pkgs.filter(p => p.status === status);
    },

    getPendingPackages: function() {
        let pkgs = this.getPackagesByStatus('pending');
        // Sort by urgent first, then deadline asc
        pkgs.sort((a, b) => {
            const daysA = window.Utils ? window.Utils.daysUntilDeadline(a.deadline) : 0;
            const daysB = window.Utils ? window.Utils.daysUntilDeadline(b.deadline) : 0;
            
            // Urgency: if days < 0 (terlambat), it's most urgent, then 0 (hari-ini), 1 (besok), etc.
            if (daysA !== daysB) {
                return daysA - daysB; // ascending deadline days
            }
            return new Date(a.created_at) - new Date(b.created_at);
        });
        return pkgs;
    },

    getUrgentPackages: function() {
        const pending = this.getPendingPackages();
        return pending.filter(p => {
            const days = window.Utils ? window.Utils.daysUntilDeadline(p.deadline) : 0;
            return days <= 1; // Hari ini (0), besok (1), atau terlambat (<0)
        });
    },

    createPackage: function(pkgData) {
        pkgData.status = 'pending';
        if (!pkgData.barcode_data && pkgData.nomor_awb) {
            pkgData.barcode_data = pkgData.nomor_awb;
        }
        return this._create(DB_KEYS.PACKAGES, pkgData);
    },

    updatePackage: function(id, updates) {
        return this._update(DB_KEYS.PACKAGES, id, updates);
    },

    markAsPickedUp: function(id) {
        return this.updatePackage(id, {
            status: 'picked_up',
            tanggal_pickup: new Date().toISOString()
        });
    },

    markAsReturned: function(id) {
        return this.updatePackage(id, {
            status: 'returned'
        });
    },

    deletePackage: function(id) {
        return this._delete(DB_KEYS.PACKAGES, id);
    },

    searchPackages: function(query) {
        if (!query) return [];
        const q = query.toLowerCase();
        const pkgs = this.getAllPackages();
        return pkgs.filter(p => {
            const namaMatch = p.nama && p.nama.toLowerCase().includes(q);
            const awbMatch = p.nomor_awb && p.nomor_awb.toLowerCase().includes(q);
            const pinMatch = p.pin && p.pin.toLowerCase().includes(q);
            return namaMatch || awbMatch || pinMatch;
        });
    },

    // --- Trip CRUD ---
    getAllTrips: function() {
        return this._getAll(DB_KEYS.TRIPS);
    },

    createTrip: function(tripData) {
        tripData.status = 'active';
        return this._create(DB_KEYS.TRIPS, tripData);
    },

    completeTrip: function(id) {
        return this._update(DB_KEYS.TRIPS, id, {
            status: 'completed',
            completed_at: new Date().toISOString()
        });
    },

    // --- Stats ---
    getStats: function() {
        const pkgs = this.getAllPackages();
        const stores = this.getAllStores();
        
        let pendingCount = 0;
        let pickedCount = 0;
        let returnedCount = 0;
        let urgentCount = 0;
        let totalDays = 0;
        let validPickupCount = 0;
        
        let storeStats = {};
        stores.forEach(s => {
            storeStats[s.id] = { store_name: s.nama_toko, count: 0 };
        });

        pkgs.forEach(p => {
            if (p.status === 'pending') {
                pendingCount++;
                const days = window.Utils ? window.Utils.daysUntilDeadline(p.deadline) : 0;
                if (days <= 1) urgentCount++;
                
                if (p.store_id && storeStats[p.store_id]) {
                    storeStats[p.store_id].count++;
                }
            } else if (p.status === 'picked_up') {
                pickedCount++;
                if (p.tanggal_pickup && p.created_at) {
                    const created = new Date(p.created_at);
                    const pickup = new Date(p.tanggal_pickup);
                    const diffDays = Math.ceil((pickup - created) / (1000 * 60 * 60 * 24));
                    totalDays += diffDays;
                    validPickupCount++;
                }
            } else if (p.status === 'returned') {
                returnedCount++;
            }
        });

        const avgPickupDays = validPickupCount > 0 ? (totalDays / validPickupCount).toFixed(1) : 0;

        return {
            totalPackages: pkgs.length,
            pendingCount,
            pickedCount,
            returnedCount,
            urgentCount,
            avgPickupDays,
            packagesByStore: Object.values(storeStats).filter(s => s.count > 0)
        };
    },

    // --- Backup & Restore ---
    exportAll: function() {
        const data = {
            stores: this.getAllStores(),
            packages: this.getAllPackages(),
            trips: this.getAllTrips(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data);
    },

    importAll: function(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.stores) this._save(DB_KEYS.STORES, data.stores);
            if (data.packages) this._save(DB_KEYS.PACKAGES, data.packages);
            if (data.trips) this._save(DB_KEYS.TRIPS, data.trips);
            return true;
        } catch (e) {
            console.error('Import failed', e);
            return false;
        }
    },

    // --- Sync Helpers ---
    getUnsyncedItems: function(key) {
        const items = this._getAll(key);
        return items.filter(item => item._synced === false);
    },

    markAsSynced: function(key, ids) {
        const items = this._getAll(key);
        let changed = false;
        items.forEach(item => {
            if (ids.indexOf(item.id) !== -1) {
                item._synced = true;
                changed = true;
            }
        });
        if (changed) this._save(key, items);
    },

    markAllAsSynced: function() {
        const keys = [DB_KEYS.STORES, DB_KEYS.PACKAGES, DB_KEYS.TRIPS];
        keys.forEach(key => {
            const items = this._getAll(key);
            let changed = false;
            items.forEach(item => {
                if (item._synced === false) {
                    item._synced = true;
                    changed = true;
                }
            });
            if (changed) this._save(key, items);
        });
    },

    cleanupDeleted: function() {
        const keys = [DB_KEYS.STORES, DB_KEYS.PACKAGES, DB_KEYS.TRIPS];
        keys.forEach(key => {
            const items = this._getAll(key);
            const filtered = items.filter(item => !(item._deleted === true && item._synced === true));
            if (filtered.length !== items.length) {
                this._save(key, filtered);
            }
        });
    }
};

window.DB = DB;
window.DB_KEYS = DB_KEYS;
