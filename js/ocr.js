// js/ocr.js

const OCR = {
    extractedData: [],
    selectedFiles: [],

    // ==================== OCR ENGINES ====================
    _getOcrSpaceApiKey: function() {
        return localStorage.getItem('paket_ocrspace_api_key') || '';
    },
    
    _getEngine: function() {
        return localStorage.getItem('paket_ocr_engine') || 'tesseract';
    },

    _fileToBase64: function(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function() { resolve({ base64: reader.result.split(',')[1], mimeType: file.type || 'image/jpeg' }); };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    _processWithOCRSpace: async function(base64Data, mimeType) {
        var apiKey = this._getOcrSpaceApiKey();
        if (!apiKey) throw new Error('API Key OCR.space belum dikonfigurasi');
        var formData = new FormData();
        formData.append('apikey', apiKey);
        formData.append('base64Image', 'data:' + mimeType + ';base64,' + base64Data);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');

        var response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('OCR.space API error: ' + response.status);
        var result = await response.json();
        
        if (result.IsErroredOnProcessing) {
            throw new Error(result.ErrorMessage ? result.ErrorMessage[0] : 'OCR Error');
        }
        
        if (!result.ParsedResults || result.ParsedResults.length === 0) {
            return ''; // No text found
        }
        
        return result.ParsedResults[0].ParsedText;
    },

    _loadTesseractIfNeeded: function() {
        return new Promise(function(resolve, reject) {
            if (window.Tesseract) return resolve();
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.onload = function() { resolve(); };
            script.onerror = function() { reject(new Error('Gagal memuat Tesseract.js')); };
            document.head.appendChild(script);
        });
    },

    _processWithTesseract: async function(file) {
        await this._loadTesseractIfNeeded();
        if (!window.Tesseract) throw new Error('Tesseract.js belum dimuat');
        var worker = await window.Tesseract.createWorker('eng');
        var result = await worker.recognize(file);
        await worker.terminate();
        return result.data.text;
    },

    // ==================== TEXT PARSING ====================
    _parseTextToData: function(text, isBulk) {
        var results = [];
        var stores = window.DB.getAllStores();
        
        if (isBulk) {
            // Very naive bulk parsing for spreadsheet screenshot texts
            var lines = text.split('\n');
            var currentStore = '';
            lines.forEach(function(line) {
                var cleanLine = line.trim();
                if (!cleanLine) return;
                
                // Try to detect store code in the line
                var codeMatch = cleanLine.match(/\b([A-Z]{4})\b/);
                if (codeMatch) currentStore = codeMatch[1];
                
                var awbMatch = cleanLine.match(/OR\d{13}/);
                var pinMatch = cleanLine.match(/\b[A-Z0-9]{6}\b/);
                
                if (awbMatch && pinMatch) {
                    // Try to guess name (everything before AWB or after PIN that isn't a store code)
                    var nameParts = cleanLine.replace(awbMatch[0], '').replace(pinMatch[0], '').trim();
                    if (codeMatch) nameParts = nameParts.replace(codeMatch[0], '').trim();
                    
                    results.push({
                        kode_toko: currentStore,
                        nama_penerima: nameParts || 'Unknown',
                        nomor_awb: awbMatch[0],
                        kode_pin: pinMatch[0]
                    });
                }
            });
        } else {
            // Single receipt parsing
            var data = {
                kode_toko: '',
                nama_penerima: 'Unknown',
                nomor_awb: '',
                kode_pin: '',
                tanggal_aktif: ''
            };
            
            // Extract AWB (OR followed by 13 digits)
            var awbMatch = text.match(/OR\d{13}/);
            if (awbMatch) data.nomor_awb = awbMatch[0];
            
            // Extract PIN (6 alphanumeric chars, often near "PIN" or "Kode")
            var pinRegex = /PIN\s*[:\-]?\s*([A-Z0-9]{6})\b/i;
            var pinMatch = text.match(pinRegex);
            if (pinMatch) {
                data.kode_pin = pinMatch[1];
            } else {
                // Fallback: any 6 char alphanumeric
                var fallbackPinMatch = text.match(/\b([A-Z0-9]{6})\b/);
                if (fallbackPinMatch) data.kode_pin = fallbackPinMatch[1];
            }
            
            // Extract Store Code (4 uppercase chars)
            var codeMatch = text.match(/\b([A-Z]{4})\b/);
            if (codeMatch) data.kode_toko = codeMatch[1];
            
            results.push(data);
        }
        
        return isBulk ? results : results[0];
    },

    updateTabs: function(activeTab) {
        var tabManual = document.getElementById('tab-manual');
        var tabOcr = document.getElementById('tab-ocr');
        var tabBulk = document.getElementById('tab-bulk');
        if (!tabManual) return;
        tabManual.className = 'btn'; tabManual.style.background = 'var(--color-surface-2)';
        tabOcr.className = 'btn'; tabOcr.style.background = 'var(--color-surface-2)';
        tabBulk.className = 'btn'; tabBulk.style.background = 'var(--color-surface-2)';
        if (activeTab === 'ocr') { tabOcr.className = 'btn btn-primary'; tabOcr.style.background = ''; }
        else if (activeTab === 'bulk') { tabBulk.className = 'btn btn-primary'; tabBulk.style.background = ''; }
    },

    // Find store by code in DB
    findStoreByCode: function(code) {
        if (!code) return null;
        var stores = window.DB.getAllStores();
        var upper = code.toUpperCase().trim();
        return stores.find(function(s) { return s.kode_toko && s.kode_toko.toUpperCase().trim() === upper; }) || null;
    },

    // Extract store code patterns from text
    detectStoreCode: function(text) {
        if (!text) return null;
        var stores = window.DB.getAllStores();
        // Try to find known store codes in text
        for (var i = 0; i < stores.length; i++) {
            var kode = stores[i].kode_toko;
            if (kode && text.toUpperCase().indexOf(kode.toUpperCase()) !== -1) {
                return { code: kode, store: stores[i] };
            }
        }
        // Try regex for common Indomaret code patterns (4 uppercase letters)
        var codeMatch = text.match(/\b([A-Z]{4})\b/);
        if (codeMatch) return { code: codeMatch[1], store: null };
        return null;
    },

    // ==================== UPLOAD OCR (Resi) ====================
    renderUpload: function() {
        this.updateTabs('ocr');
        var container = document.getElementById('package-form-container');
        if (!container) return;
        document.getElementById('view-add-title').innerText = 'Upload OCR Resi';
        var now = new Date().toISOString().split('T')[0];
        var deadline = window.Utils.calculateDeadline(now, 7);
        var html = '<div class="card glassmorphism slideUp">' +
            '<div class="form-group">' +
                '<label>Pilih Gambar / Screenshot Resi</label>' +
                '<div id="ocr-dropzone" style="border:2px dashed var(--color-surface-2);border-radius:var(--radius);padding:2rem;text-align:center;cursor:pointer;transition:all 0.3s;" onclick="document.getElementById(\'ocr_files\').click()">' +
                    '<div style="font-size:2rem;margin-bottom:1rem;">📸</div>' +
                    '<p>Tap untuk pilih gambar atau Drag & Drop ke sini</p>' +
                    '<p style="font-size:0.75rem;color:var(--color-text-muted);">Bisa pilih banyak gambar sekaligus</p>' +
                    '<input type="file" id="ocr_files" multiple accept="image/*" style="display:none;" onchange="OCR.handleFileSelect(event)">' +
                '</div>' +
            '</div>' +
            '<div id="ocr-preview" style="display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;margin-bottom:1rem;"></div>' +
            '<div style="display:flex;gap:0.5rem;margin-bottom:1rem;">' +
                '<div class="form-group" style="flex:1;margin-bottom:0;">' +
                    '<label>Batas Terakhir Pickup</label>' +
                    '<input type="date" id="ocr_deadline" value="' + deadline + '" style="width:100%;padding:0.75rem;border-radius:var(--radius);border:1px solid var(--color-surface-2);background-color:var(--color-bg);color:var(--color-text);font-family:var(--font-main);">' +
                '</div>' +
                '<div class="form-group" style="flex:0 0 auto;margin-bottom:0;display:flex;align-items:flex-end;">' +
                    '<label style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem;background:var(--color-surface-2);border-radius:var(--radius);cursor:pointer;white-space:nowrap;">' +
                        '<input type="checkbox" id="ocr_urgent"> 🔴 Urgent' +
                    '</label>' +
                '</div>' +
            '</div>' +
            '<button id="btn-process-ocr" class="btn btn-primary" style="width:100%;display:none;" onclick="OCR.startProcessing()">Proses OCR</button>' +
            '<div id="ocr-progress" style="display:none;margin-top:1rem;text-align:center;">' +
                '<p id="ocr-status-text">Memproses 0/0 gambar...</p>' +
                '<div style="width:100%;background-color:var(--color-surface-2);border-radius:8px;height:8px;overflow:hidden;margin-top:0.5rem;">' +
                    '<div id="ocr-progress-bar" style="height:100%;width:0%;background-color:var(--color-primary);transition:width 0.3s ease;"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
        container.innerHTML = html;
        this.selectedFiles = [];
        this._setupDropzone('ocr-dropzone', 'ocr_files');
    },

    _setupDropzone: function(dzId, inputId) {
        var dropzone = document.getElementById(dzId);
        if (!dropzone) return;
        dropzone.addEventListener('dragover', function(e) { e.preventDefault(); dropzone.style.borderColor = 'var(--color-primary)'; dropzone.style.background = 'rgba(108,92,231,0.1)'; });
        dropzone.addEventListener('dragleave', function(e) { e.preventDefault(); dropzone.style.borderColor = 'var(--color-surface-2)'; dropzone.style.background = 'transparent'; });
        dropzone.addEventListener('drop', function(e) {
            e.preventDefault(); dropzone.style.borderColor = 'var(--color-surface-2)'; dropzone.style.background = 'transparent';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                document.getElementById(inputId).files = e.dataTransfer.files;
                OCR.handleFileSelect({ target: { files: e.dataTransfer.files } });
            }
        });
    },

    handleFileSelect: function(event) {
        var files = Array.from(event.target.files);
        if (files.length === 0) return;
        this.selectedFiles = files;
        var previewContainer = document.getElementById('ocr-preview');
        previewContainer.innerHTML = '';
        files.forEach(function(file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = document.createElement('img');
                img.src = e.target.result;
                img.style.height = '60px'; img.style.borderRadius = '4px'; img.style.border = '1px solid var(--color-surface-2)';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
        document.getElementById('btn-process-ocr').style.display = 'block';
    },

    startProcessing: async function() {
        var engine = this._getEngine();
        if (engine === 'ocrspace' && !this._getOcrSpaceApiKey()) {
            window.Utils.showToast('⚠️ API Key OCR.space belum diset. Buka ⚙️ Settings.', 'warning');
            return;
        }

        document.getElementById('btn-process-ocr').style.display = 'none';
        document.getElementById('ocr-progress').style.display = 'block';
        
        var deadlineVal = document.getElementById('ocr_deadline') ? document.getElementById('ocr_deadline').value : '';
        var urgentVal = document.getElementById('ocr_urgent') ? document.getElementById('ocr_urgent').checked : false;
        
        this.extractedData = [];
        var total = this.selectedFiles.length;
        var progressBar = document.getElementById('ocr-progress-bar');
        var statusText = document.getElementById('ocr-status-text');
        var failCount = 0;
        
        for (var i = 0; i < total; i++) {
            statusText.innerText = '📷 Memproses gambar ' + (i+1) + ' dari ' + total + ' (' + engine + ')...';
            progressBar.style.width = Math.round((i / total) * 100) + '%';
            try {
                var extractedText = '';
                if (engine === 'ocrspace') {
                    var fileData = await this._fileToBase64(this.selectedFiles[i]);
                    extractedText = await this._processWithOCRSpace(fileData.base64, fileData.mimeType);
                } else {
                    extractedText = await this._processWithTesseract(this.selectedFiles[i]);
                }
                
                var result = this._parseTextToData(extractedText, false);
                if (!result) continue;

                // Cross-reference store code with local DB
                var storeId = '';
                var storeCode = (result.kode_toko || '').toUpperCase();
                if (storeCode) {
                    var found = this.findStoreByCode(storeCode);
                    if (found) storeId = found.kode_toko;
                }
                
                // Calculate deadline from tanggal_aktif (+3 days)
                var extractedDeadline = deadlineVal;
                if (result.tanggal_aktif) {
                    var parsedDate = new Date(result.tanggal_aktif);
                    if (!isNaN(parsedDate.getTime())) {
                        parsedDate.setDate(parsedDate.getDate() + 3);
                        extractedDeadline = parsedDate.toISOString().split('T')[0];
                    }
                }
                
                this.extractedData.push({
                    store_id: storeId,
                    store_code: storeCode,
                    nama: result.nama_penerima || 'Unknown',
                    nomor_awb: (result.nomor_awb || '').toUpperCase(),
                    pin: (result.kode_pin || '').toUpperCase(),
                    deadline: extractedDeadline,
                    urgent: urgentVal,
                    catatan: 'OCR Extract'
                });
            } catch (err) { console.error('OCR error', err); failCount++; }
        }
        progressBar.style.width = '100%';
        statusText.innerText = 'Selesai! ' + this.extractedData.length + ' berhasil' + (failCount > 0 ? ', ' + failCount + ' gagal' : '');
        if (failCount > 0) window.Utils.showToast('⚠️ ' + failCount + ' gambar gagal diproses', 'warning');
        var self = this;
        setTimeout(function() { self.renderReview(); }, 500);
    },


    // ==================== PASTE BULK (Excel Screenshot OCR) ====================
    renderBulkPaste: function() {
        this.updateTabs('bulk');
        var container = document.getElementById('package-form-container');
        if (!container) return;
        document.getElementById('view-add-title').innerText = 'Upload Screenshot Excel';
        var now = new Date().toISOString().split('T')[0];
        var deadline = window.Utils.calculateDeadline(now, 7);
        var html = '<div class="card glassmorphism slideUp">' +
            '<div class="form-group">' +
                '<label>Upload Screenshot Excel / Spreadsheet</label>' +
                '<div id="bulk-dropzone" style="border:2px dashed var(--color-surface-2);border-radius:var(--radius);padding:2rem;text-align:center;cursor:pointer;transition:all 0.3s;" onclick="document.getElementById(\'bulk_files\').click()">' +
                    '<div style="font-size:2rem;margin-bottom:1rem;">📊</div>' +
                    '<p>Tap untuk upload screenshot Excel</p>' +
                    '<p style="font-size:0.75rem;color:var(--color-text-muted);">Otomatis deteksi Kode Toko, AWB, Nama, PIN</p>' +
                    '<input type="file" id="bulk_files" multiple accept="image/*" style="display:none;" onchange="OCR.handleBulkFileSelect(event)">' +
                '</div>' +
            '</div>' +
            '<div id="bulk-preview" style="display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;margin-bottom:1rem;"></div>' +
            '<div style="display:flex;gap:0.5rem;margin-bottom:1rem;">' +
                '<div class="form-group" style="flex:1;margin-bottom:0;">' +
                    '<label>Batas Terakhir Pickup</label>' +
                    '<input type="date" id="bulk_deadline" value="' + deadline + '" style="width:100%;padding:0.75rem;border-radius:var(--radius);border:1px solid var(--color-surface-2);background-color:var(--color-bg);color:var(--color-text);font-family:var(--font-main);">' +
                '</div>' +
                '<div class="form-group" style="flex:0 0 auto;margin-bottom:0;display:flex;align-items:flex-end;">' +
                    '<label style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem;background:var(--color-surface-2);border-radius:var(--radius);cursor:pointer;white-space:nowrap;">' +
                        '<input type="checkbox" id="bulk_urgent"> 🔴 Urgent' +
                    '</label>' +
                '</div>' +
            '</div>' +
            '<button id="btn-process-bulk" class="btn btn-primary" style="width:100%;display:none;" onclick="OCR.startBulkProcessing()">Proses OCR Screenshot</button>' +
            '<div id="bulk-progress" style="display:none;margin-top:1rem;text-align:center;">' +
                '<p id="bulk-status-text">Memproses...</p>' +
                '<div style="width:100%;background-color:var(--color-surface-2);border-radius:8px;height:8px;overflow:hidden;margin-top:0.5rem;">' +
                    '<div id="bulk-progress-bar" style="height:100%;width:0%;background-color:var(--color-primary);transition:width 0.3s ease;"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
        container.innerHTML = html;
        this.selectedFiles = [];
        this._setupDropzone('bulk-dropzone', 'bulk_files');
    },

    handleBulkFileSelect: function(event) {
        var files = Array.from(event.target.files);
        if (files.length === 0) return;
        this.selectedFiles = files;
        var previewContainer = document.getElementById('bulk-preview');
        previewContainer.innerHTML = '';
        files.forEach(function(file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = document.createElement('img');
                img.src = e.target.result;
                img.style.height = '80px'; img.style.borderRadius = '4px'; img.style.border = '1px solid var(--color-surface-2)';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
        document.getElementById('btn-process-bulk').style.display = 'block';
    },

    startBulkProcessing: async function() {
        var engine = this._getEngine();
        if (engine === 'ocrspace' && !this._getOcrSpaceApiKey()) {
            window.Utils.showToast('⚠️ API Key OCR.space belum diset. Buka ⚙️ Settings.', 'warning');
            return;
        }

        document.getElementById('btn-process-bulk').style.display = 'none';
        document.getElementById('bulk-progress').style.display = 'block';
        
        var deadlineVal = document.getElementById('bulk_deadline') ? document.getElementById('bulk_deadline').value : '';
        var urgentVal = document.getElementById('bulk_urgent') ? document.getElementById('bulk_urgent').checked : false;
        
        this.extractedData = [];
        var total = this.selectedFiles.length;
        var progressBar = document.getElementById('bulk-progress-bar');
        var statusText = document.getElementById('bulk-status-text');
        var failCount = 0;
        
        for (var i = 0; i < total; i++) {
            statusText.innerText = '📷 Memproses screenshot ' + (i+1) + ' dari ' + total + ' (' + engine + ')...';
            progressBar.style.width = Math.round((i / total) * 100) + '%';
            try {
                var extractedText = '';
                if (engine === 'ocrspace') {
                    var fileData = await this._fileToBase64(this.selectedFiles[i]);
                    extractedText = await this._processWithOCRSpace(fileData.base64, fileData.mimeType);
                } else {
                    extractedText = await this._processWithTesseract(this.selectedFiles[i]);
                }
                
                var result = this._parseTextToData(extractedText, true);
                
                // Normalize: ensure result is array
                var rows = Array.isArray(result) ? result : [result];
                
                for (var r = 0; r < rows.length; r++) {
                    var row = rows[r];
                    if (!row || !row.nomor_awb) continue; // Skip empty rows

                    var storeId = '';
                    var storeCode = (row.kode_toko || '').toUpperCase();
                    if (storeCode) {
                        var found = this.findStoreByCode(storeCode);
                        if (found) storeId = found.kode_toko;
                    }
                    this.extractedData.push({
                        store_id: storeId,
                        store_code: storeCode,
                        nama: row.nama_penerima || 'Unknown',
                        nomor_awb: (row.nomor_awb || '').toUpperCase(),
                        pin: (row.kode_pin || '').toUpperCase(),
                        deadline: deadlineVal,
                        urgent: urgentVal,
                        catatan: 'OCR Bulk'
                    });
                }
            } catch (err) { console.error('OCR Bulk error', err); failCount++; }
        }
        progressBar.style.width = '100%';
        statusText.innerText = 'Selesai! ' + this.extractedData.length + ' data terdeteksi.' + (failCount > 0 ? ' (' + failCount + ' gagal)' : '');
        var self = this;
        setTimeout(function() { if (self.extractedData.length > 0) self.renderReview(); else window.Utils.showToast('Tidak ada data yang terdeteksi', 'danger'); }, 500);
    },


    // ==================== REVIEW & SAVE ====================
    renderReview: function() {
        var container = document.getElementById('package-form-container');
        if (!container) return;
        var stores = window.DB.getAllStores();
        var storeDatalist = '<datalist id="store_list_rev">';
        stores.forEach(function(s) { storeDatalist += '<option value="' + s.kode_toko + ' - ' + s.nama_toko + '"></option>'; });
        storeDatalist += '</datalist>';
        
        var html = '<div class="card glassmorphism slideUp">' + storeDatalist +
            '<h3 style="margin-top:0;">Review Data (' + this.extractedData.length + ' item)</h3>' +
            '<p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:1rem;">Periksa dan perbaiki hasil deteksi sebelum disimpan.</p>' +
            '<div style="overflow-x:auto;">' +
                '<table style="width:100%;min-width:700px;border-collapse:collapse;margin-bottom:1rem;">' +
                    '<thead><tr style="border-bottom:1px solid var(--color-surface-2);text-align:left;">' +
                        '<th style="padding:0.5rem;">Toko</th>' +
                        '<th style="padding:0.5rem;">Nama</th>' +
                        '<th style="padding:0.5rem;">AWB</th>' +
                        '<th style="padding:0.5rem;">PIN</th>' +
                        '<th style="padding:0.5rem;">Deadline</th>' +
                        '<th style="padding:0.5rem;text-align:center;">Urgent</th>' +
                        '<th style="padding:0.5rem;">Aksi</th>' +
                    '</tr></thead><tbody>';
        
        var existingPackages = window.DB.getAllPackages();
        
        for (var idx = 0; idx < this.extractedData.length; idx++) {
            var d = this.extractedData[idx];
            var storeInputVal = '';
            if (d.store_id) {
                var sFound = stores.find(function(s) { return s.kode_toko === d.store_id; });
                if (sFound) storeInputVal = sFound.kode_toko + ' - ' + sFound.nama_toko;
            } else if (d.store_code) {
                storeInputVal = d.store_code;
            }

            var awbWarning = '';
            var pinWarning = '';
            var awbStyle = 'width:100%;padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;';
            var pinStyle = 'width:80px;padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;';
            
            var isDuplicate = d.nomor_awb && existingPackages.some(function(p) { return p.nomor_awb && p.nomor_awb.toUpperCase().trim() === d.nomor_awb.toUpperCase().trim(); });
            
            if (isDuplicate) {
                awbStyle += 'border-color:var(--color-urgent); background-color:rgba(235, 77, 75, 0.2);';
                awbWarning = '<span style="color:var(--color-urgent);font-size:0.7rem;display:block;">⚠️ Duplikat</span>';
            } else if (d.nomor_awb && !d.nomor_awb.toUpperCase().match(/^OR\d{13}$/)) {
                awbStyle += 'border-color:var(--color-warning); background-color:rgba(241, 196, 15, 0.2);';
                awbWarning = '<span style="color:var(--color-warning);font-size:0.7rem;display:block;">⚠️ Format: OR+13 angka</span>';
            }
            
            if (d.pin && !d.pin.toUpperCase().match(/^[A-Z0-9]{6}$/)) {
                pinStyle += 'border-color:var(--color-warning); background-color:rgba(241, 196, 15, 0.2);';
                pinWarning = '<span style="color:var(--color-warning);font-size:0.7rem;display:block;">⚠️ Harus 6 kar</span>';
            }

            html += '<tr id="review-row-' + idx + '" style="border-bottom:1px solid var(--color-surface-2);">' +
                '<td style="padding:0.5rem;"><input list="store_list_rev" id="rev_store_' + idx + '" value="' + window.Utils.escapeHtml(storeInputVal) + '" placeholder="Ketik/Pilih Toko" style="width:100%;padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;font-size:0.8rem;"></td>' +
                '<td style="padding:0.5rem;"><input type="text" id="rev_nama_' + idx + '" value="' + window.Utils.escapeHtml(d.nama || '') + '" style="width:100%;padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;"></td>' +
                '<td style="padding:0.5rem;"><input type="text" id="rev_awb_' + idx + '" value="' + window.Utils.escapeHtml(d.nomor_awb || '') + '" style="' + awbStyle + '">' + awbWarning + '</td>' +
                '<td style="padding:0.5rem;"><input type="text" id="rev_pin_' + idx + '" value="' + window.Utils.escapeHtml(d.pin || '') + '" style="' + pinStyle + '">' + pinWarning + '</td>' +
                '<td style="padding:0.5rem;"><input type="date" id="rev_deadline_' + idx + '" value="' + (d.deadline || '') + '" style="padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;"></td>' +
                '<td style="padding:0.5rem;text-align:center;"><input type="checkbox" id="rev_urgent_' + idx + '"' + (d.urgent ? ' checked' : '') + '></td>' +
                '<td style="padding:0.5rem;"><button class="btn badge-danger" style="padding:0.25rem 0.5rem;border:none;" onclick="OCR.removeRow(' + idx + ')">✕</button></td>' +
            '</tr>';
        }
        
        html += '</tbody></table></div>' +
            '<div style="display:flex;gap:0.5rem;">' +
                '<button class="btn btn-primary" style="flex:1;" onclick="OCR.saveAll()">Simpan Semua (' + this.extractedData.length + ')</button>' +
                '<button class="btn" style="flex:1;background-color:var(--color-surface-2);color:white;" onclick="OCR.renderUpload()">Batal</button>' +
            '</div>' +
        '</div>';
        container.innerHTML = html;
    },

    removeRow: function(index) {
        this.syncInputsToData();
        this.extractedData.splice(index, 1);
        this.renderReview();
    },

    syncInputsToData: function() {
        for (var i = 0; i < this.extractedData.length; i++) {
            var storeInput = document.getElementById('rev_store_' + i);
            var namaInput = document.getElementById('rev_nama_' + i);
            var awbInput = document.getElementById('rev_awb_' + i);
            var pinInput = document.getElementById('rev_pin_' + i);
            var deadlineInput = document.getElementById('rev_deadline_' + i);
            var urgentInput = document.getElementById('rev_urgent_' + i);
            
            if (storeInput) {
                var val = storeInput.value.trim();
                if (val.includes(' - ')) {
                    this.extractedData[i].store_id = val.split(' - ')[0].trim();
                    this.extractedData[i].store_code = val.split(' - ')[0].trim();
                } else {
                    this.extractedData[i].store_code = val;
                }
            }
            if (namaInput) this.extractedData[i].nama = namaInput.value.trim();
            if (awbInput) this.extractedData[i].nomor_awb = awbInput.value.trim();
            if (pinInput) this.extractedData[i].pin = pinInput.value.trim();
            if (deadlineInput) this.extractedData[i].deadline = deadlineInput.value;
            if (urgentInput) this.extractedData[i].urgent = urgentInput.checked;
        }
    },

    saveAll: function() {
        this.syncInputsToData();
        
        var savedCount = 0;
        var now = new Date().toISOString().split('T')[0];
        var defaultDeadline = window.Utils.calculateDeadline(now, 7);
        
        var existingPackages = window.DB.getAllPackages();
        var awbSet = new Set(existingPackages.map(function(p) { return (p.nomor_awb || '').toUpperCase().trim(); }));
        var batchAwbSet = new Set();
        var duplicatesCount = 0;
        
        for (var i = 0; i < this.extractedData.length; i++) {
            var d = this.extractedData[i];
            var storeId = d.store_id || d.store_code || '';
            
            if (storeId) {
                var stores = window.DB.getAllStores();
                var sMatch = stores.find(function(s) { return s.kode_toko === storeId || (s.kode_toko + ' - ' + s.nama_toko) === storeId; });
                if (sMatch) {
                    storeId = sMatch.kode_toko;
                } else {
                    var possibleCode = storeId.split(' ')[0].trim().toUpperCase();
                    var sCodeMatch = stores.find(function(s) { return s.kode_toko.toUpperCase() === possibleCode; });
                    if (sCodeMatch) storeId = sCodeMatch.kode_toko;
                }
            }
            
            var nama = d.nama ? d.nama.trim() : '';
            var pin = d.pin ? d.pin.trim() : '';
            var awb = d.nomor_awb ? d.nomor_awb.trim() : '';
            var deadlineVal = d.deadline || defaultDeadline;
            
            if (nama && pin) {
                var awbUpper = awb.toUpperCase();
                
                if (awbUpper) {
                    if (awbSet.has(awbUpper) || batchAwbSet.has(awbUpper)) {
                        duplicatesCount++;
                        continue;
                    }
                    batchAwbSet.add(awbUpper);
                }
                
                var newPkg = window.DB.createPackage({
                    store_id: storeId,
                    nama: nama,
                    nomor_awb: awb,
                    pin: pin,
                    invoice: '',
                    tanggal_masuk: now + 'T00:00:00.000Z',
                    deadline: deadlineVal + 'T23:59:59.999Z',
                    urgent: d.urgent,
                    catatan: 'Bulk Input'
                });
                // Auto-add to active trip
                window.DB.addPackageToActiveTrip(newPkg.id);
                savedCount++;
            }
        }
        
        if (savedCount > 0) {
            var msg = savedCount + ' paket berhasil disimpan';
            if (duplicatesCount > 0) {
                msg += ' (' + duplicatesCount + ' duplikat dilewati)';
            }
            window.Utils.showToast(msg, 'success');
            if (window.AuditLog) window.AuditLog.log('BULK_CREATE', 'package', { count: savedCount });
        } else {
            if (duplicatesCount > 0) {
                window.Utils.showToast('Gagal menyimpan: ' + duplicatesCount + ' data terdeteksi duplikat', 'danger');
            } else {
                window.Utils.showToast('Tidak ada data yang disimpan (Nama & PIN wajib)', 'warning');
            }
        }
        window.location.hash = '#dashboard';
    },

    // Keep backward compat for processPaste (text-based fallback)
    processPaste: function() {
        var text = document.getElementById('bulk_paste_text');
        if (!text) return;
        var val = text.value.trim();
        if (!val) { window.Utils.showToast('Teks kosong', 'warning'); return; }
        var lines = val.split('\n');
        this.extractedData = [];
        var stores = window.DB.getAllStores();
        var now = new Date().toISOString().split('T')[0];
        var deadline = window.Utils.calculateDeadline(now, 7);
        lines.forEach(function(line) {
            var cols = line.split('\t');
            if (cols.length >= 3) {
                var storeCode = cols.length >= 4 ? cols[0].trim() : '';
                var found = stores.find(function(s) { return s.kode_toko && s.kode_toko.toUpperCase() === storeCode.toUpperCase(); });
                OCR.extractedData.push({ store_id: found ? found.kode_toko : '', store_code: storeCode, nama: cols.length >= 4 ? cols[1].trim() : cols[0].trim(), nomor_awb: cols.length >= 4 ? cols[2].trim() : cols[1].trim(), pin: cols.length >= 4 ? cols[3].trim() : cols[2].trim(), deadline: deadline, urgent: false });
            }
        });
        if (this.extractedData.length > 0) this.renderReview();
        else window.Utils.showToast('Format tidak sesuai', 'danger');
    }
};

window.OCR = OCR;
