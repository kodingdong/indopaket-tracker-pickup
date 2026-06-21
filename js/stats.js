// js/stats.js

const Stats = {
    render: function() {
        const container = document.getElementById('view-stats');
        if (!container) return;

        const pkgs = window.DB.getAllPackages();
        const stores = window.DB.getAllStores();
        
        let total = pkgs.length;
        let pending = 0;
        let pickedUp = 0;
        let returned = 0;
        let totalPickupDays = 0;
        let pickupCountWithDates = 0;

        // Count per store
        const storeCounts = {};
        stores.forEach(s => storeCounts[s.kode_toko] = { nama: s.nama_toko, count: 0 });

        pkgs.forEach(p => {
            if (p.status === 'pending') pending++;
            else if (p.status === 'picked_up') pickedUp++;
            else if (p.status === 'returned') returned++;

            if (p.store_id && storeCounts[p.store_id]) {
                storeCounts[p.store_id].count++;
            }

            if (p.status === 'picked_up' && p.tanggal_masuk && p.tanggal_pickup) {
                const masuk = new Date(p.tanggal_masuk);
                const pickup = new Date(p.tanggal_pickup);
                const diffTime = Math.abs(pickup - masuk);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalPickupDays += diffDays;
                pickupCountWithDates++;
            }
        });

        const pickedUpPercent = total > 0 ? Math.round((pickedUp / total) * 100) : 0;
        const avgPickupTime = pickupCountWithDates > 0 ? (totalPickupDays / pickupCountWithDates).toFixed(1) : 0;

        // Calculate pie chart degrees
        const pPending = total > 0 ? (pending / total) * 360 : 0;
        const pPickedUp = total > 0 ? (pickedUp / total) * 360 : 0;
        const pReturned = total > 0 ? (returned / total) * 360 : 0;
        // Conic gradient string
        const conicGradient = total > 0 
            ? `conic-gradient(var(--color-warning) 0deg ${pPending}deg, var(--color-success) ${pPending}deg ${pPending + pPickedUp}deg, var(--color-danger) ${pPending + pPickedUp}deg 360deg)`
            : `conic-gradient(var(--color-surface-2) 0deg 360deg)`;

        // Calculate bar charts
        const storeBars = Object.values(storeCounts)
            .sort((a, b) => b.count - a.count)
            .map(s => {
                const percent = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return `
                    <div style="margin-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                            <span>${s.nama}</span>
                            <span>${s.count} (${percent}%)</span>
                        </div>
                        <div style="width: 100%; background: var(--color-surface-2); border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="width: ${percent}%; background: var(--color-primary); height: 100%;"></div>
                        </div>
                    </div>
                `;
            }).join('');

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="font-size: 1.5rem; margin: 0;">Statistik & Laporan</h2>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="card glassmorphism" style="margin-bottom: 0; text-align: center; padding: 1rem;">
                    <p style="font-size: 0.75rem; color: var(--color-text-muted);">TOTAL PAKET</p>
                    <h3 style="font-size: 2rem; margin: 0.5rem 0 0 0;">${total}</h3>
                </div>
                <div class="card glassmorphism" style="margin-bottom: 0; text-align: center; padding: 1rem; border-bottom: 3px solid var(--color-success);">
                    <p style="font-size: 0.75rem; color: var(--color-text-muted);">SUDAH DIAMBIL</p>
                    <h3 style="font-size: 1.5rem; margin: 0.5rem 0 0 0;">${pickedUpPercent}%</h3>
                    <p style="font-size: 0.75rem; color: var(--color-success); margin-top: 0.25rem;">${pickedUp} paket</p>
                </div>
                <div class="card glassmorphism" style="margin-bottom: 0; text-align: center; padding: 1rem; border-bottom: 3px solid var(--color-warning);">
                    <p style="font-size: 0.75rem; color: var(--color-text-muted);">PENDING</p>
                    <h3 style="font-size: 1.5rem; margin: 0.5rem 0 0 0;">${pending}</h3>
                </div>
                <div class="card glassmorphism" style="margin-bottom: 0; text-align: center; padding: 1rem; border-bottom: 3px solid var(--color-danger);">
                    <p style="font-size: 0.75rem; color: var(--color-text-muted);">RETUR / EXPIRED</p>
                    <h3 style="font-size: 1.5rem; margin: 0.5rem 0 0 0;">${returned}</h3>
                </div>
            </div>

            <div class="card glassmorphism" style="margin-bottom: 1.5rem;">
                <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem;">Rata-rata Waktu Pickup</h3>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 2.5rem; font-weight: 800; color: var(--color-primary);">${avgPickupTime}</div>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.4;">
                        Hari<br>Dihitung dari tanggal paket masuk<br>hingga diambil dari Indomaret.
                    </div>
                </div>
            </div>

            <div class="card glassmorphism" style="margin-bottom: 1.5rem;">
                <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem;">Distribusi Status</h3>
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="width: 100px; height: 100px; border-radius: 50%; background: ${conicGradient};"></div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                            <div style="width: 12px; height: 12px; background: var(--color-warning); border-radius: 2px;"></div>
                            Pending (${pending})
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                            <div style="width: 12px; height: 12px; background: var(--color-success); border-radius: 2px;"></div>
                            Diambil (${pickedUp})
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                            <div style="width: 12px; height: 12px; background: var(--color-danger); border-radius: 2px;"></div>
                            Retur (${returned})
                        </div>
                    </div>
                </div>
            </div>

            <div class="card glassmorphism" style="margin-bottom: 1.5rem;">
                <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem;">Paket per Toko IDM</h3>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${storeBars || '<p style="color:var(--color-text-muted); font-size: 0.85rem;">Belum ada data toko.</p>'}
                </div>
            </div>

            <div class="card glassmorphism">
                <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem;">Backup & Restore Data</h3>
                <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1rem;">Simpan data Anda ke file JSON atau restore data dari file backup sebelumnya.</p>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="Stats.exportData()">⬇️ Export</button>
                    <button class="btn" style="flex: 1; background: var(--color-surface-2); color: white;" onclick="document.getElementById('import-file').click()">⬆️ Import</button>
                    <input type="file" id="import-file" accept=".json" style="display: none;" onchange="Stats.importData(event)">
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    exportData: function() {
        try {
            const data = {
                stores: window.DB.getAllStores(),
                packages: window.DB.getAllPackages(),
                trips: window.DB.getAllTrips(),
                exportDate: new Date().toISOString()
            };
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href",     dataStr);
            downloadAnchorNode.setAttribute("download", "paket_backup_" + new Date().getTime() + ".json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            window.Utils.showToast("Data berhasil diexport", "success");
        } catch(e) {
            console.error(e);
            window.Utils.showToast("Gagal export data", "danger");
        }
    },

    importData: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.stores && data.packages) {
                    if (confirm("Restore data akan menimpa data saat ini. Lanjutkan?")) {
                        localStorage.setItem('paket_stores', JSON.stringify(data.stores));
                        localStorage.setItem('paket_packages', JSON.stringify(data.packages));
                        if (data.trips) {
                            localStorage.setItem('paket_trips', JSON.stringify(data.trips));
                        }
                        window.Utils.showToast("Data berhasil direstore", "success");
                        // Refresh view
                        this.render();
                    }
                } else {
                    window.Utils.showToast("Format file tidak sesuai", "warning");
                }
            } catch (err) {
                console.error(err);
                window.Utils.showToast("Gagal membaca file JSON", "danger");
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
};

window.Stats = Stats;
