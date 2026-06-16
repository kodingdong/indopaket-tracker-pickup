// js/ocr.js

const OCR = {
    extractedData: [],
    selectedFiles: [],
    
    updateTabs: function(activeTab) {
        const tabManual = document.getElementById('tab-manual');
        const tabOcr = document.getElementById('tab-ocr');
        const tabBulk = document.getElementById('tab-bulk');
        if (!tabManual) return;
        
        tabManual.className = 'btn';
        tabManual.style.background = 'var(--color-surface-2)';
        tabOcr.className = 'btn';
        tabOcr.style.background = 'var(--color-surface-2)';
        tabBulk.className = 'btn';
        tabBulk.style.background = 'var(--color-surface-2)';
        
        if (activeTab === 'ocr') {
            tabOcr.className = 'btn btn-primary';
            tabOcr.style.background = '';
        } else if (activeTab === 'bulk') {
            tabBulk.className = 'btn btn-primary';
            tabBulk.style.background = '';
        }
    },

    renderUpload: function() {
        this.updateTabs('ocr');
        const container = document.getElementById('package-form-container');
        if (!container) return;
        
        document.getElementById('view-add-title').innerText = 'Upload OCR';

        const stores = window.DB.getAllStores();
        const storeOptions = stores.map(s => 
            `<option value="${s.id}">${s.nama_toko} (${s.kode_toko})</option>`
        ).join('');

        const html = `
            <div class="card glassmorphism slideUp">
                <div class="form-group">
                    <label>Toko Indomaret (Wajib)</label>
                    <select id="ocr_store" required style="width: 100%; padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background-color: var(--color-bg); color: var(--color-text); font-family: var(--font-main);">
                        <option value="">-- Pilih Toko --</option>
                        ${storeOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Pilih Gambar / Screenshot Resi</label>
                    <div id="ocr-dropzone" style="border: 2px dashed var(--color-surface-2); border-radius: var(--radius); padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s;" onclick="document.getElementById('ocr_files').click()">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">📸</div>
                        <p>Tap untuk pilih gambar atau Drag & Drop ke sini</p>
                        <p style="font-size: 0.75rem; color: var(--color-text-muted);">Bisa pilih banyak gambar sekaligus</p>
                        <input type="file" id="ocr_files" multiple accept="image/*" style="display: none;" onchange="OCR.handleFileSelect(event)">
                    </div>
                </div>
                
                <div id="ocr-preview" style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1rem;"></div>
                
                <button id="btn-process-ocr" class="btn btn-primary" style="width: 100%; display: none;" onclick="OCR.startProcessing()">Proses OCR</button>
                <div id="ocr-progress" style="display: none; margin-top: 1rem; text-align: center;">
                    <p id="ocr-status-text">Memproses 0/0 gambar...</p>
                    <div style="width: 100%; background-color: var(--color-surface-2); border-radius: 8px; height: 8px; overflow: hidden; margin-top: 0.5rem;">
                        <div id="ocr-progress-bar" style="height: 100%; width: 0%; background-color: var(--color-primary); transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
        this.selectedFiles = [];
        
        // Setup Drag & Drop
        const dropzone = document.getElementById('ocr-dropzone');
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--color-primary)';
            dropzone.style.background = 'rgba(108, 92, 231, 0.1)';
        });
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--color-surface-2)';
            dropzone.style.background = 'transparent';
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--color-surface-2)';
            dropzone.style.background = 'transparent';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                document.getElementById('ocr_files').files = e.dataTransfer.files;
                OCR.handleFileSelect({ target: { files: e.dataTransfer.files } });
            }
        });
    },

    handleFileSelect: function(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        
        this.selectedFiles = files;
        const previewContainer = document.getElementById('ocr-preview');
        previewContainer.innerHTML = '';
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.height = '60px';
                img.style.borderRadius = '4px';
                img.style.border = '1px solid var(--color-surface-2)';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
        
        document.getElementById('btn-process-ocr').style.display = 'block';
    },

    startProcessing: async function() {
        const storeId = document.getElementById('ocr_store').value;
        if (!storeId) {
            window.Utils.showToast('Pilih toko terlebih dahulu', 'warning');
            return;
        }

        if (typeof Tesseract === 'undefined') {
            window.Utils.showToast('Library Tesseract belum dimuat', 'danger');
            return;
        }

        document.getElementById('btn-process-ocr').style.display = 'none';
        document.getElementById('ocr-progress').style.display = 'block';
        
        this.extractedData = [];
        const total = this.selectedFiles.length;
        const progressBar = document.getElementById('ocr-progress-bar');
        const statusText = document.getElementById('ocr-status-text');
        
        for (let i = 0; i < total; i++) {
            statusText.innerText = `Memproses gambar ${i+1} dari ${total}...`;
            progressBar.style.width = Math.round(((i) / total) * 100) + '%';
            
            try {
                const result = await Tesseract.recognize(this.selectedFiles[i], 'ind+eng');
                const text = result.data.text;
                
                const awbMatch = text.match(/IDP\d+/i);
                const pinMatch = text.match(/\b\d{6}\b/);
                
                let nama = 'Unknown';
                const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                for (let line of lines) {
                    if (line.length > 3 && !line.includes('IDP') && !line.match(/\d/)) {
                        nama = line;
                        break;
                    }
                }
                
                this.extractedData.push({
                    store_id: storeId,
                    nama: nama,
                    nomor_awb: awbMatch ? awbMatch[0].toUpperCase() : '',
                    pin: pinMatch ? pinMatch[0] : '',
                    invoice: '',
                    urgent: false,
                    catatan: 'Hasil OCR'
                });
            } catch (err) {
                console.error("OCR error on file", this.selectedFiles[i], err);
            }
        }
        
        progressBar.style.width = '100%';
        statusText.innerText = 'Selesai!';
        
        setTimeout(() => {
            this.renderReview(storeId);
        }, 500);
    },

    renderReview: function(storeId) {
        const container = document.getElementById('package-form-container');
        if (!container) return;
        
        let html = `
            <div class="card glassmorphism slideUp">
                <h3 style="margin-top: 0;">Review Data (Bisa Diedit)</h3>
                <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1rem;">Silakan periksa dan perbaiki hasil ekstraksi sebelum disimpan.</p>
                
                <div style="overflow-x: auto;">
                    <table style="width: 100%; min-width: 600px; border-collapse: collapse; margin-bottom: 1rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--color-surface-2); text-align: left;">
                                <th style="padding: 0.5rem;">Nama</th>
                                <th style="padding: 0.5rem;">AWB</th>
                                <th style="padding: 0.5rem;">PIN</th>
                                <th style="padding: 0.5rem; text-align: center;">Urgent</th>
                                <th style="padding: 0.5rem;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        this.extractedData.forEach((data, index) => {
            html += `
                <tr id="review-row-${index}" style="border-bottom: 1px solid var(--color-surface-2);">
                    <td style="padding: 0.5rem;"><input type="text" id="rev_nama_${index}" value="${data.nama}" style="width: 100%; padding: 0.25rem; background: transparent; border: 1px solid var(--color-surface-2); color: white;"></td>
                    <td style="padding: 0.5rem;"><input type="text" id="rev_awb_${index}" value="${data.nomor_awb}" style="width: 100%; padding: 0.25rem; background: transparent; border: 1px solid var(--color-surface-2); color: white;"></td>
                    <td style="padding: 0.5rem;"><input type="text" id="rev_pin_${index}" value="${data.pin}" style="width: 100%; padding: 0.25rem; background: transparent; border: 1px solid var(--color-surface-2); color: white;"></td>
                    <td style="padding: 0.5rem; text-align: center;"><input type="checkbox" id="rev_urgent_${index}" ${data.urgent ? 'checked' : ''}></td>
                    <td style="padding: 0.5rem;"><button class="btn badge-danger" style="padding: 0.25rem 0.5rem; border: none;" onclick="OCR.removeRow(${index})">Hapus</button></td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="OCR.saveBulk('${storeId}')">Simpan Semua (${this.extractedData.length})</button>
                    <button class="btn" style="flex: 1; background-color: var(--color-surface-2); color: white;" onclick="OCR.renderUpload()">Batal</button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },

    removeRow: function(index) {
        document.getElementById(`review-row-${index}`).style.display = 'none';
        document.getElementById(`review-row-${index}`).setAttribute('data-deleted', 'true');
    },

    saveBulk: function(storeId) {
        let savedCount = 0;
        const now = new Date().toISOString().split('T')[0];
        const deadline = window.Utils.calculateDeadline(now, 7);
        
        this.extractedData.forEach((_, index) => {
            const row = document.getElementById(`review-row-${index}`);
            if (row && row.getAttribute('data-deleted') !== 'true') {
                const nama = document.getElementById(`rev_nama_${index}`).value.trim();
                const pin = document.getElementById(`rev_pin_${index}`).value.trim();
                if (nama && pin) {
                    window.DB.createPackage({
                        store_id: storeId,
                        nama: nama,
                        nomor_awb: document.getElementById(`rev_awb_${index}`).value.trim(),
                        pin: pin,
                        invoice: '',
                        tanggal_masuk: now + 'T00:00:00.000Z',
                        deadline: deadline + 'T23:59:59.999Z',
                        urgent: document.getElementById(`rev_urgent_${index}`).checked,
                        catatan: 'Bulk Input'
                    });
                    savedCount++;
                }
            }
        });
        
        window.Utils.showToast(`${savedCount} paket berhasil disimpan`, 'success');
        window.location.hash = '#dashboard';
    },

    renderBulkPaste: function() {
        this.updateTabs('bulk');
        const container = document.getElementById('package-form-container');
        if (!container) return;
        
        document.getElementById('view-add-title').innerText = 'Paste Bulk Data';

        const stores = window.DB.getAllStores();
        const storeOptions = stores.map(s => 
            `<option value="${s.id}">${s.nama_toko} (${s.kode_toko})</option>`
        ).join('');

        const html = `
            <div class="card glassmorphism slideUp">
                <div class="form-group">
                    <label>Toko Indomaret (Wajib)</label>
                    <select id="bulk_store" required style="width: 100%; padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background-color: var(--color-bg); color: var(--color-text); font-family: var(--font-main);">
                        <option value="">-- Pilih Toko --</option>
                        ${storeOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Paste dari Excel / Spreadsheet</label>
                    <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Format urutan kolom: Nama | AWB | PIN</p>
                    <textarea id="bulk_paste_text" rows="8" placeholder="Contoh:&#10;Budi&#9;IDP123&#9;112233&#10;Siti&#9;IDP456&#9;445566" style="width: 100%; padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background-color: var(--color-bg); color: var(--color-text); font-family: var(--font-main); resize: vertical; white-space: pre;"></textarea>
                </div>
                
                <button class="btn btn-primary" style="width: 100%;" onclick="OCR.processPaste()">Review Data</button>
            </div>
        `;
        container.innerHTML = html;
    },

    processPaste: function() {
        const storeId = document.getElementById('bulk_store').value;
        if (!storeId) {
            window.Utils.showToast('Pilih toko terlebih dahulu', 'warning');
            return;
        }
        
        const text = document.getElementById('bulk_paste_text').value.trim();
        if (!text) {
            window.Utils.showToast('Teks kosong', 'warning');
            return;
        }
        
        const lines = text.split('\n');
        this.extractedData = [];
        
        lines.forEach(line => {
            const cols = line.split('\t');
            if (cols.length >= 3) {
                this.extractedData.push({
                    nama: cols[0].trim(),
                    nomor_awb: cols[1].trim(),
                    pin: cols[2].trim(),
                    urgent: false
                });
            } else if (cols.length === 2) {
                this.extractedData.push({
                    nama: cols[0].trim(),
                    nomor_awb: '',
                    pin: cols[1].trim(),
                    urgent: false
                });
            }
        });
        
        if (this.extractedData.length > 0) {
            this.renderReview(storeId);
        } else {
            window.Utils.showToast('Format tidak sesuai. Gunakan Tab (copy dari excel)', 'danger');
        }
    }
};

window.OCR = OCR;
