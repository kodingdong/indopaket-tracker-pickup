// js/package.js

const Package = {
    renderForm: function(packageId = null) {
        const container = document.getElementById('package-form-container');
        if (!container) return;

        const tabManual = document.getElementById('tab-manual');
        const tabOcr = document.getElementById('tab-ocr');
        const tabBulk = document.getElementById('tab-bulk');
        if (tabManual && tabOcr && tabBulk) {
            tabManual.className = 'btn btn-primary';
            tabManual.style.background = '';
            tabOcr.className = 'btn';
            tabOcr.style.background = 'var(--color-surface-2)';
            tabBulk.className = 'btn';
            tabBulk.style.background = 'var(--color-surface-2)';
            
            // Hide tabs if editing
            const tabsContainer = document.getElementById('add-tabs');
            if (tabsContainer) {
                tabsContainer.style.display = packageId ? 'none' : 'flex';
            }
        }

        let pkg = {
            store_id: '',
            nama: '',
            nomor_awb: '',
            pin: '',
            invoice: '',
            tanggal_masuk: new Date().toISOString().split('T')[0],
            deadline: window.Utils.calculateDeadline(new Date().toISOString().split('T')[0], 7),
            urgent: false,
            catatan: ''
        };
        let isEdit = false;

        if (packageId) {
            const existing = window.DB._getById('paket_packages', packageId);
            if (existing) {
                pkg = { ...existing };
                isEdit = true;
                // format dates for input[type="date"]
                if (pkg.tanggal_masuk) pkg.tanggal_masuk = pkg.tanggal_masuk.split('T')[0];
                if (pkg.deadline) pkg.deadline = pkg.deadline.split('T')[0];
            }
        }

        const stores = window.DB.getAllStores();
        
        let selectedStoreText = '';
        if (pkg.store_id) {
            const ss = stores.find(s => s.kode_toko === pkg.store_id);
            if (ss) selectedStoreText = `${ss.nama_toko} (${ss.kode_toko})`;
        }

        const storeOptions = stores.map(s => 
            `<option value="${s.nama_toko} (${s.kode_toko})"></option>`
        ).join('');

        const html = `
            <div class="card glassmorphism slideUp">
                <form id="packageForm" onsubmit="event.preventDefault(); Package.handleSave('${isEdit ? packageId : ''}')">
                    <div class="form-group">
                        <label>Toko Indomaret (Wajib)</label>
                        <input list="store_list" id="pkg_store_input" value="${selectedStoreText}" required placeholder="-- Ketik nama atau kode toko --" style="width: 100%; padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background-color: var(--color-bg); color: var(--color-text); font-family: var(--font-main);">
                        <datalist id="store_list">
                            ${storeOptions}
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label>Nama Penerima (Wajib)</label>
                        <input type="text" id="pkg_nama" value="${pkg.nama || ''}" required placeholder="Nama sesuai paket">
                    </div>
                    <div class="form-group">
                        <label>Nomor AWB / Resi</label>
                        <input type="text" id="pkg_awb" value="${pkg.nomor_awb || ''}" placeholder="Misal: IDP123456789">
                    </div>
                    <div class="form-group">
                        <label>Kode PIN (Wajib)</label>
                        <input type="text" id="pkg_pin" value="${pkg.pin || ''}" required placeholder="Misal: 123456">
                    </div>
                    <div class="form-group">
                        <label>Invoice (Opsional)</label>
                        <input type="text" id="pkg_invoice" value="${pkg.invoice || ''}" placeholder="Misal: INV/2023/...">
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <label>Tanggal Masuk</label>
                            <input type="date" id="pkg_tgl_masuk" value="${pkg.tanggal_masuk}" required onchange="Package.updateDeadline()">
                        </div>
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <label>Deadline (Auto H+7)</label>
                            <input type="date" id="pkg_deadline" value="${pkg.deadline}" required>
                        </div>
                    </div>

                    <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; background: var(--color-surface-2); padding: 0.75rem; border-radius: var(--radius);">
                        <label style="margin-bottom: 0;">Tandai Urgent (Mendesak)</label>
                        <div style="position: relative; display: inline-block; width: 50px; height: 26px;">
                            <input type="checkbox" id="pkg_urgent" ${pkg.urgent ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                            <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${pkg.urgent ? 'var(--color-urgent)' : '#ccc'}; transition: .4s; border-radius: 34px;" onclick="Package.toggleUrgent(this)">
                                <span style="position: absolute; content: ''; height: 18px; width: 18px; left: ${pkg.urgent ? '28px' : '4px'}; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
                            </span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Catatan (Opsional)</label>
                        <textarea id="pkg_catatan" rows="3" placeholder="Tambahkan catatan jika perlu" style="width: 100%; padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background-color: var(--color-bg); color: var(--color-text); font-family: var(--font-main); resize: vertical;">${pkg.catatan || ''}</textarea>
                    </div>

                    <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">${isEdit ? 'Update' : 'Simpan Paket'}</button>
                        ${isEdit ? `<button type="button" class="btn" style="flex: 1; background-color: var(--color-surface-2); color: white;" onclick="window.location.hash='#dashboard'">Batal</button>` : ''}
                    </div>
                </form>
            </div>
        `;

        container.innerHTML = html;
        document.getElementById('view-add-title').innerText = isEdit ? 'Edit Paket' : 'Tambah Paket Baru';
    },

    toggleUrgent: function(sliderSpan) {
        const checkbox = document.getElementById('pkg_urgent');
        checkbox.checked = !checkbox.checked;
        const knob = sliderSpan.querySelector('span');
        if (checkbox.checked) {
            sliderSpan.style.backgroundColor = 'var(--color-urgent)';
            knob.style.left = '28px';
        } else {
            sliderSpan.style.backgroundColor = '#ccc';
            knob.style.left = '4px';
        }
    },

    updateDeadline: function() {
        const tglMasuk = document.getElementById('pkg_tgl_masuk').value;
        if (tglMasuk) {
            // Requirement is auto H+7
            document.getElementById('pkg_deadline').value = window.Utils.calculateDeadline(tglMasuk, 7);
        }
    },

    handleSave: function(packageId) {
        const storeInput = document.getElementById('pkg_store_input').value;
        const stores = window.DB.getAllStores();
        const selectedStore = stores.find(s => `${s.nama_toko} (${s.kode_toko})` === storeInput);
        const store_id = selectedStore ? selectedStore.kode_toko : '';
        
        const nama = document.getElementById('pkg_nama').value.trim();
        const pin = document.getElementById('pkg_pin').value.trim();
        
        if (!store_id) {
            window.Utils.showToast('Pilih toko yang valid dari daftar', 'danger');
            return;
        }
        if (!nama || !pin) {
            window.Utils.showToast('Nama dan PIN wajib diisi', 'danger');
            return;
        }

        const data = {
            store_id,
            nama,
            nomor_awb: document.getElementById('pkg_awb').value.trim(),
            pin,
            invoice: document.getElementById('pkg_invoice').value.trim(),
            tanggal_masuk: document.getElementById('pkg_tgl_masuk').value + 'T00:00:00.000Z',
            deadline: document.getElementById('pkg_deadline').value + 'T23:59:59.999Z',
            urgent: document.getElementById('pkg_urgent').checked,
            catatan: document.getElementById('pkg_catatan').value.trim()
        };

        if (packageId) {
            window.DB.updatePackage(packageId, data);
            window.Utils.showToast('Paket berhasil diupdate', 'success');
            if (window.AuditLog) window.AuditLog.log('UPDATE_PACKAGE', 'package', { nama: nama, nomor_awb: data.nomor_awb });
        } else {
            window.DB.createPackage(data);
            window.Utils.showToast('Paket berhasil ditambahkan', 'success');
            if (window.AuditLog) window.AuditLog.log('CREATE_PACKAGE', 'package', { nama: nama, nomor_awb: data.nomor_awb, pin: pin });
        }

        window.location.hash = '#dashboard';
    },

    renderDetail: function(id) {
        const container = document.getElementById('package-detail-container');
        if (!container) return;

        const pkg = window.DB._getById('paket_packages', id);
        if (!pkg) {
            container.innerHTML = '<p>Paket tidak ditemukan</p>';
            return;
        }

        const store = window.DB.getStoreByKode(pkg.store_id);
        const storeName = store ? store.nama_toko : 'Toko Tidak Diketahui';
        
        const daysRemaining = window.Utils.daysUntilDeadline(pkg.deadline);
        const statusClass = pkg.status === 'picked_up' ? 'success' : pkg.status === 'returned' ? 'danger' : daysRemaining <= 1 || pkg.urgent ? 'urgent' : 'warning';
        
        const statusText = pkg.status === 'picked_up' ? 'Sudah Diambil' : pkg.status === 'returned' ? 'Dikembalikan' : window.Utils.getDeadlineStatus(daysRemaining);

        const html = `
            <div class="card glassmorphism slideUp">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <span class="badge badge-${statusClass}" style="margin-bottom: 0.5rem; display: inline-block;">${statusText}</span>
                        ${pkg.urgent ? '<span class="badge badge-urgent" style="margin-left: 0.5rem; display: inline-block;">URGENT</span>' : ''}
                        <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${pkg.nama}</h2>
                        <p style="color: var(--color-text-muted); font-size: 0.875rem;">${storeName}</p>
                    </div>
                </div>

                <div style="background-color: var(--color-surface-2); padding: 1.5rem; border-radius: var(--radius); text-align: center; margin-bottom: 1.5rem;">
                    <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 0.5rem;">KODE PIN</p>
                    <div style="font-size: 48px; font-weight: 700; letter-spacing: 4px; color: var(--color-primary);">${pkg.pin}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="grid-column: span 2; text-align: center; background: white; padding: 0.5rem; border-radius: var(--radius); overflow: hidden;">
                        <canvas id="barcode-detail-${pkg.id}"></canvas>
                    </div>
                    <div>
                        <p style="color: var(--color-text-muted); font-size: 0.75rem;">NO. RESI / AWB</p>
                        <p style="font-weight: 500;">${pkg.nomor_awb || '-'}</p>
                    </div>
                    <div>
                        <p style="color: var(--color-text-muted); font-size: 0.75rem;">INVOICE</p>
                        <p style="font-weight: 500;">${pkg.invoice || '-'}</p>
                    </div>
                    <div>
                        <p style="color: var(--color-text-muted); font-size: 0.75rem;">TANGGAL MASUK</p>
                        <p style="font-weight: 500;">${window.Utils.formatDate(pkg.tanggal_masuk)}</p>
                    </div>
                    <div>
                        <p style="color: var(--color-text-muted); font-size: 0.75rem;">BATAS PENGAMBILAN</p>
                        <p style="font-weight: 500; color: ${daysRemaining < 0 ? 'var(--color-urgent)' : 'inherit'};">${window.Utils.formatDate(pkg.deadline)}</p>
                    </div>
                </div>

                ${pkg.catatan ? `
                <div style="margin-bottom: 1.5rem;">
                    <p style="color: var(--color-text-muted); font-size: 0.75rem;">CATATAN</p>
                    <p style="font-size: 0.875rem; line-height: 1.5; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 8px;">${pkg.catatan}</p>
                </div>
                ` : ''}

                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${pkg.status === 'pending' ? `
                    <button class="btn btn-primary" style="background-color: var(--color-success);" onclick="Package.handleMarkPickedUp('${pkg.id}')">Tandai Sudah Diambil</button>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn" style="flex: 1; background-color: var(--color-surface-2); color: white;" onclick="window.location.hash='#add?edit=${pkg.id}'">Edit</button>
                        <button class="btn badge-danger" style="flex: 1; border: none;" onclick="Package.handleDelete('${pkg.id}')">Hapus</button>
                    </div>
                    ` : ''}
                    <button class="btn" style="background-color: transparent; border: 1px solid var(--color-surface-2); color: white;" onclick="window.history.back()">Kembali</button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        if (pkg.nomor_awb && window.Barcode) {
            setTimeout(() => {
                window.Barcode.generateBarcode(pkg.nomor_awb, `barcode-detail-${pkg.id}`);
            }, 50);
        }
    },

    handleMarkPickedUp: function(id) {
        if (confirm('Tandai paket ini sudah diambil?')) {
            var pkg = window.DB._getById('paket_packages', id);
            window.DB.markAsPickedUp(id);
            window.Utils.showToast('Status paket diperbarui', 'success');
            if (window.AuditLog) window.AuditLog.log('PICKUP_PACKAGE', 'package', { nama: pkg ? pkg.nama : '', nomor_awb: pkg ? pkg.nomor_awb : '' });
            window.history.back();
        }
    },

    handleDelete: function(id) {
        if (confirm('Hapus paket ini secara permanen?')) {
            var pkg = window.DB._getById('paket_packages', id);
            window.DB.deletePackage(id);
            window.Utils.showToast('Paket dihapus', 'success');
            if (window.AuditLog) window.AuditLog.log('DELETE_PACKAGE', 'package', { nama: pkg ? pkg.nama : '', nomor_awb: pkg ? pkg.nomor_awb : '' });
            window.history.back();
        }
    }
};

window.Package = Package;
