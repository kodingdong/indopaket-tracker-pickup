// js/store.js
const Store = {
    render: function() {
        const container = document.getElementById('stores-container');
        if (!container) return;
        
        const stores = window.DB.getAllStores();
        if (stores.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-muted); margin-top: 2rem;">Belum ada toko yang ditambahkan.</p>';
            return;
        }

        let html = '';
        stores.forEach(s => {
            const pkgs = window.DB.getPackagesByStore(s.id);
            const activePkgs = pkgs.filter(p => p.status === 'pending').length;
            
            html += `
                <div class="card glassmorphism fadeIn" style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">${s.nama_toko}</h3>
                            <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Kode: ${s.kode_toko}</p>
                            <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 0.5rem;">${s.alamat || '-'}</p>
                            <div>
                                <span class="badge ${activePkgs > 0 ? 'badge-warning' : 'badge-success'}">${activePkgs} paket aktif</span>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.875rem;" onclick="Store.renderForm('${s.id}')">Edit</button>
                            <button class="btn badge-danger" style="padding: 0.4rem 0.8rem; font-size: 0.875rem; border: none; cursor: pointer; border-radius: var(--radius);" onclick="Store.handleDelete('${s.id}')">Hapus</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    renderForm: function(storeId = null) {
        const container = document.getElementById('store-form-container');
        if (!container) return;
        
        let store = { kode_toko: '', nama_toko: '', alamat: '' };
        let isEdit = false;
        
        if (storeId) {
            const existing = window.DB._getById('paket_stores', storeId);
            if (existing) {
                store = existing;
                isEdit = true;
            }
        }
        
        const html = `
            <div class="card glassmorphism slideUp">
                <h3 style="margin-bottom: 1rem;">${isEdit ? 'Edit Toko' : 'Tambah Toko'}</h3>
                <form id="storeForm" onsubmit="event.preventDefault(); Store.handleSave('${isEdit ? storeId : ''}')">
                    <div class="form-group">
                        <label>Kode IDM</label>
                        <input type="text" id="store_kode" value="${store.kode_toko}" required placeholder="Misal: T1AB">
                    </div>
                    <div class="form-group">
                        <label>Nama Toko</label>
                        <input type="text" id="store_nama" value="${store.nama_toko}" required placeholder="Misal: Indomaret Plus">
                    </div>
                    <div class="form-group">
                        <label>Alamat (Opsional)</label>
                        <input type="text" id="store_alamat" value="${store.alamat || ''}" placeholder="Alamat lengkap toko">
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Simpan</button>
                        <button type="button" class="btn" style="flex: 1; background-color: var(--color-surface-2); color: white;" onclick="Store.closeForm()">Batal</button>
                    </div>
                </form>
            </div>
        `;
        
        container.innerHTML = html;
        container.style.display = 'block';
        document.getElementById('stores-container').style.display = 'none';
        document.getElementById('add-store-btn').style.display = 'none';
    },

    closeForm: function() {
        document.getElementById('store-form-container').style.display = 'none';
        document.getElementById('stores-container').style.display = 'block';
        document.getElementById('add-store-btn').style.display = 'block';
    },

    handleSave: function(storeId) {
        const kode = document.getElementById('store_kode').value.trim();
        const nama = document.getElementById('store_nama').value.trim();
        const alamat = document.getElementById('store_alamat').value.trim();
        
        if (!kode || !nama) {
            window.Utils.showToast('Kode dan Nama toko wajib diisi', 'danger');
            return;
        }

        // Check duplicate
        const existingByKode = window.DB.getStoreByKode(kode);
        if (existingByKode && existingByKode.id !== storeId) {
            window.Utils.showToast('Kode IDM sudah digunakan', 'danger');
            return;
        }

        const data = { kode_toko: kode, nama_toko: nama, alamat: alamat };

        if (storeId) {
            window.DB.updateStore(storeId, data);
            window.Utils.showToast('Toko berhasil diupdate', 'success');
        } else {
            window.DB.createStore(data);
            window.Utils.showToast('Toko berhasil ditambahkan', 'success');
        }
        
        this.closeForm();
        this.render();
    },

    handleDelete: function(storeId) {
        if (confirm('Apakah Anda yakin ingin menghapus toko ini? Semua paket terkait akan kehilangan referensi nama tokonya.')) {
            window.DB.deleteStore(storeId);
            window.Utils.showToast('Toko berhasil dihapus', 'success');
            this.render();
        }
    }
};

window.Store = Store;
