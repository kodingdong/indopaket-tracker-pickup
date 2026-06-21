// js/ocr.js

const OCR = {
    extractedData: [],
    selectedFiles: [],
    
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
        if (typeof Tesseract === 'undefined') { window.Utils.showToast('Library Tesseract belum dimuat', 'danger'); return; }
        document.getElementById('btn-process-ocr').style.display = 'none';
        document.getElementById('ocr-progress').style.display = 'block';
        
        var deadlineVal = document.getElementById('ocr_deadline') ? document.getElementById('ocr_deadline').value : '';
        var urgentVal = document.getElementById('ocr_urgent') ? document.getElementById('ocr_urgent').checked : false;
        
        this.extractedData = [];
        var total = this.selectedFiles.length;
        var progressBar = document.getElementById('ocr-progress-bar');
        var statusText = document.getElementById('ocr-status-text');
        var unknownCodes = [];
        
        for (var i = 0; i < total; i++) {
            statusText.innerText = 'Memproses gambar ' + (i+1) + ' dari ' + total + '...';
            progressBar.style.width = Math.round(((i) / total) * 100) + '%';
            try {
                var result = await Tesseract.recognize(this.selectedFiles[i], 'ind+eng');
                var text = result.data.text;
                var storeResult = this.detectStoreCode(text);
                var storeId = '';
                if (storeResult) {
                    if (storeResult.store) {
                        storeId = storeResult.store.kode_toko;
                    } else {
                        unknownCodes.push(storeResult.code);
                    }
                }
                
                // Extract AWB: Priority 1: IDP/OR/SPX/JNT prefixes, Priority 2: 10+ alphanumeric WITH at least one digit IN THE WORD
                var awbMatch = text.match(/\b(?:IDP|OR|SPX|JNT|JP|JX)[A-Z0-9]{5,20}\b/i) || text.match(/\b(?=[A-Z0-9]*\d)[A-Z0-9]{10,25}\b/i);
                var awb = awbMatch ? awbMatch[0].toUpperCase() : '';
                
                // Extract PIN: Priority 1: 6 chars with at least one digit, Priority 2: any 6 digits
                var pinMatch = text.match(/\b(?=[A-Z]*\d)[A-Z0-9]{6}\b/i) || text.match(/\b\d{6}\b/i);
                var pin = pinMatch ? pinMatch[0].toUpperCase() : '';

                // Extract Deadline from "Diperbarui Aktif" (e.g. "05-Jun-2026")
                var extractedDeadline = deadlineVal;
                var activeDateMatch = text.match(/\b(\d{1,2})-(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)-(\d{4})\b/i);
                if (activeDateMatch) {
                    var monthStr = activeDateMatch[2].toLowerCase();
                    var monthMap = {'jan':'01','feb':'02','mar':'03','apr':'04','mei':'05','jun':'06','jul':'07','agu':'08','sep':'09','okt':'10','nov':'11','des':'12'};
                    var m = monthMap[monthStr];
                    var d = activeDateMatch[1].padStart(2, '0');
                    var y = activeDateMatch[3];
                    var parsedDate = new Date(y + '-' + m + '-' + d);
                    if (!isNaN(parsedDate.getTime())) {
                        parsedDate.setDate(parsedDate.getDate() + 3); // Tambah 3 hari dari tanggal aktif
                        extractedDeadline = parsedDate.toISOString().split('T')[0];
                    }
                }

                // Extract Nama: Filter out static Indopaket tracking labels
                var nama = '';
                var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 2; });
                var blacklistExact = ['estimated delivery', 'current status', 'dalam pengantaran', 'pesanan ditempatkan', 'telah dikirim', 'sedang transit', 'paket sudah tiba di', 'paket sudah dilakukan', 'kurir', 'indopaket', 'nomor awb', 'kode pin', 'diperbarui aktif', 'invoice number'];
                for (var j = 0; j < lines.length; j++) {
                    var line = lines[j];
                    var lower = line.toLowerCase();
                    if (awb && line.toUpperCase().indexOf(awb) !== -1) continue;
                    if (pin && line.toUpperCase().indexOf(pin) !== -1) continue;
                    if (storeResult && line.toUpperCase().indexOf(storeResult.code.toUpperCase()) !== -1) continue;
                    if (line.match(/^[\d\s:,\.-]+$/)) continue; // skip pure numbers/dates
                    if (line.match(/^[A-Z0-9\s:-]+$/) && line.length < 10) continue; // skip short codes
                    
                    var isBlacklisted = false;
                    for (var b = 0; b < blacklistExact.length; b++) {
                        if (lower.indexOf(blacklistExact[b]) !== -1) { isBlacklisted = true; break; }
                    }
                    if (isBlacklisted) {
                        var pIdx = lower.indexOf('paket sudah tiba di');
                        if (pIdx !== -1) {
                            var afterTiba = line.substring(pIdx + 19).trim();
                            if (afterTiba.toLowerCase().startsWith('toko')) afterTiba = afterTiba.substring(4).trim();
                            // Convert trailing | or ! to i (common Tesseract OCR error for 'i')
                            afterTiba = afterTiba.replace(/[\|!]\s*$/, 'i');
                            afterTiba = afterTiba.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
                            if (afterTiba.length > 2) nama = afterTiba;
                        }
                        continue;
                    }
                    if (lower.match(/(senin|selasa|rabu|kamis|jumat|sabtu|minggu|jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)/)) continue;
                    
                    var cleanLine = line.replace(/[\|!]\s*$/, 'i');
                    nama = cleanLine.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''); 
                    break;
                }
                if (!nama) nama = 'Unknown';
                
                // Cleanup Tesseract artifact where big text is read as single letters with spaces (e.g. "H e r i")
                if (nama.match(/^([A-Za-z]\s)+[A-Za-z]$/)) {
                    nama = nama.replace(/\s+/g, '');
                }

                this.extractedData.push({
                    store_id: storeId,
                    store_code: storeResult ? storeResult.code : '',
                    nama: nama,
                    nomor_awb: awb,
                    pin: pin,
                    deadline: extractedDeadline,
                    urgent: urgentVal,
                    catatan: 'Hasil OCR'
                });
            } catch (err) { console.error('OCR error', err); }
        }
        progressBar.style.width = '100%';
        statusText.innerText = 'Selesai!';
        if (unknownCodes.length > 0) {
            var unique = unknownCodes.filter(function(v, i, a) { return a.indexOf(v) === i; });
            window.Utils.showToast('⚠️ Kode toko terdeteksi tapi tidak ada di daftar: ' + unique.join(', '), 'warning');
        }
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
        if (typeof Tesseract === 'undefined') { window.Utils.showToast('Library Tesseract belum dimuat', 'danger'); return; }
        document.getElementById('btn-process-bulk').style.display = 'none';
        document.getElementById('bulk-progress').style.display = 'block';
        
        var deadlineVal = document.getElementById('bulk_deadline') ? document.getElementById('bulk_deadline').value : '';
        var urgentVal = document.getElementById('bulk_urgent') ? document.getElementById('bulk_urgent').checked : false;
        
        this.extractedData = [];
        var total = this.selectedFiles.length;
        var progressBar = document.getElementById('bulk-progress-bar');
        var statusText = document.getElementById('bulk-status-text');
        var unknownCodes = [];
        
        for (var i = 0; i < total; i++) {
            statusText.innerText = 'Memproses screenshot ' + (i+1) + ' dari ' + total + '...';
            progressBar.style.width = Math.round((i / total) * 100) + '%';
            try {
                var result = await Tesseract.recognize(this.selectedFiles[i], 'ind+eng');
                var text = result.data.text;
                var rows = this._parseExcelScreenshot(text, deadlineVal, urgentVal, unknownCodes);
                this.extractedData = this.extractedData.concat(rows);
            } catch (err) { console.error('Bulk OCR error', err); }
        }
        progressBar.style.width = '100%';
        statusText.innerText = 'Selesai! ' + this.extractedData.length + ' data terdeteksi.';
        if (unknownCodes.length > 0) {
            var unique = unknownCodes.filter(function(v, i, a) { return a.indexOf(v) === i; });
            window.Utils.showToast('⚠️ Kode toko tidak ditemukan di daftar: ' + unique.join(', '), 'warning');
        }
        var self = this;
        setTimeout(function() { if (self.extractedData.length > 0) self.renderReview(); else window.Utils.showToast('Tidak ada data yang terdeteksi', 'danger'); }, 500);
    },

    _parseExcelScreenshot: function(text, deadline, urgent, unknownCodes) {
        var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 2; });
        var results = [];
        var stores = window.DB.getAllStores();
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var storeCode = ''; var storeId = ''; var awb = ''; var pin = '';
            var nama = line;

            // 1. Extract AWB (10-25 alphanumeric chars WITH at least one digit IN THE WORD, ignore phone numbers starting with 08)
            var awbMatches = nama.match(/\b(?=[A-Z0-9]*\d)[A-Z0-9]{10,25}\b/ig);
            if (awbMatches) {
                for (var j = 0; j < awbMatches.length; j++) {
                    if (!awbMatches[j].match(/^08\d+$/)) {
                        awb = awbMatches[j].toUpperCase();
                        nama = nama.replace(awbMatches[j], '');
                        break;
                    }
                }
            }

            // 2. Extract PIN (6 alphanumeric chars, preferably with a digit)
            var pinRegex = /\b(?=[A-Z]*\d)[A-Z0-9]{6}\b/i; // Must contain at least one digit
            var pinMatch = nama.match(pinRegex);
            if (!pinMatch) {
                // Fallback to any 6 alphanumeric if no digit found, take from the end of string
                var fallbackMatch = nama.match(/\b[A-Z0-9]{6}\b/ig);
                if (fallbackMatch) pinMatch = [fallbackMatch[fallbackMatch.length - 1]];
            }
            if (pinMatch) {
                pin = pinMatch[0].toUpperCase();
                nama = nama.replace(new RegExp('\\b' + pinMatch[0] + '\\b', 'i'), '');
            }

            // 3. Extract Store Code (check against known stores first)
            var foundStore = false;
            for (var s = 0; s < stores.length; s++) {
                var kode = stores[s].kode_toko;
                if (kode && kode.length >= 3) {
                    var regex = new RegExp('\\b' + kode + '\\b', 'i');
                    if (nama.match(regex)) {
                        storeCode = kode.toUpperCase();
                        storeId = stores[s].kode_toko;
                        nama = nama.replace(regex, '');
                        foundStore = true;
                        break;
                    }
                }
            }
            
            // If exact store not found, use a fuzzy match to catch OCR typos (e.g. 'tion' or 'ton' instead of 'TJON')
            if (!foundStore) {
                var words = nama.split(/\s+/);
                for (var w = 0; w < words.length; w++) {
                    var word = words[w];
                    if (word.length >= 3 && word.length <= 5 && !word.match(/^\d+$/)) {
                        for (var s = 0; s < stores.length; s++) {
                            var code = (stores[s].kode_toko || '').toLowerCase();
                            var wl = word.toLowerCase();
                            if (code.length >= 3 && wl[0] === code[0] && wl[wl.length-1] === code[code.length-1] && Math.abs(code.length - wl.length) <= 1) {
                                storeCode = stores[s].kode_toko.toUpperCase();
                                storeId = stores[s].kode_toko;
                                nama = nama.replace(new RegExp('\\b' + word + '\\b', 'i'), '');
                                foundStore = true;
                                break;
                            }
                        }
                    }
                    if (foundStore) break;
                }
            }
            
            // Fallback 3: try to guess a 4-letter code that looks like a store code (MUST BE ALL CAPS)
            if (!foundStore) {
                var storeMatch = nama.match(/\b[A-Z0-9]{4}\b/);
                if (storeMatch && !storeMatch[0].match(/^\d+$/)) {
                    storeCode = storeMatch[0].toUpperCase();
                    unknownCodes.push(storeCode);
                    nama = nama.replace(storeMatch[0], '');
                }
            }

            // Clean up nama (remove extra spaces and non-alphabet characters at the edges)
            nama = nama.replace(/\s+/g, ' ').trim();
            // Remove common leftover artifacts like single letters or symbols if isolated
            nama = nama.replace(/^[^\w\s]\s*/, '').replace(/\s*[^\w\s]$/, '');
            
            if (nama || awb) {
                results.push({
                    store_id: storeId,
                    store_code: storeCode,
                    nama: nama || 'Unknown',
                    nomor_awb: awb,
                    pin: pin,
                    deadline: deadline,
                    urgent: urgent,
                    catatan: 'Bulk OCR'
                });
            }
        }
        return results;
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
        
        for (var idx = 0; idx < this.extractedData.length; idx++) {
            var d = this.extractedData[idx];
            var storeInputVal = '';
            if (d.store_id) {
                var sFound = stores.find(function(s) { return s.kode_toko === d.store_id; });
                if (sFound) storeInputVal = sFound.kode_toko + ' - ' + sFound.nama_toko;
            } else if (d.store_code) {
                storeInputVal = d.store_code;
            }
            html += '<tr id="review-row-' + idx + '" style="border-bottom:1px solid var(--color-surface-2);">' +
                '<td style="padding:0.5rem;"><input list="store_list_rev" id="rev_store_' + idx + '" value="' + storeInputVal + '" placeholder="Ketik/Pilih Toko" style="width:100%;padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;font-size:0.8rem;"></td>' +
                '<td style="padding:0.5rem;"><input type="text" id="rev_nama_' + idx + '" value="' + (d.nama || '') + '" style="width:100%;padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;"></td>' +
                '<td style="padding:0.5rem;"><input type="text" id="rev_awb_' + idx + '" value="' + (d.nomor_awb || '') + '" style="width:100%;padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;"></td>' +
                '<td style="padding:0.5rem;"><input type="text" id="rev_pin_' + idx + '" value="' + (d.pin || '') + '" style="width:80px;padding:0.25rem;background:transparent;border:1px solid var(--color-surface-2);color:white;"></td>' +
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
        var row = document.getElementById('review-row-' + index);
        if (row) { row.style.display = 'none'; row.setAttribute('data-deleted', 'true'); }
    },

    saveAll: function() {
        var savedCount = 0;
        var now = new Date().toISOString().split('T')[0];
        var defaultDeadline = window.Utils.calculateDeadline(now, 7);
        
        for (var i = 0; i < this.extractedData.length; i++) {
            var row = document.getElementById('review-row-' + i);
            if (row && row.getAttribute('data-deleted') !== 'true') {
                var storeInputStr = document.getElementById('rev_store_' + i).value.trim();
                var storeId = '';
                if (storeInputStr) {
                    var stores = window.DB.getAllStores();
                    var sMatch = stores.find(function(s) { return (s.kode_toko + ' - ' + s.nama_toko) === storeInputStr; });
                    if (sMatch) storeId = sMatch.kode_toko;
                    else {
                        var possibleCode = storeInputStr.split(' ')[0].trim().toUpperCase();
                        var sCodeMatch = stores.find(function(s) { return s.kode_toko.toUpperCase() === possibleCode || s.kode_toko.toUpperCase() === storeInputStr.toUpperCase(); });
                        if (sCodeMatch) storeId = sCodeMatch.kode_toko;
                        else storeId = storeInputStr; // Raw string fallback
                    }
                }
                
                var nama = document.getElementById('rev_nama_' + i).value.trim();
                var pin = document.getElementById('rev_pin_' + i).value.trim();
                var deadlineVal = document.getElementById('rev_deadline_' + i).value || defaultDeadline;
                if (nama && pin) {
                    window.DB.createPackage({
                        store_id: storeId,
                        nama: nama,
                        nomor_awb: document.getElementById('rev_awb_' + i).value.trim(),
                        pin: pin,
                        invoice: '',
                        tanggal_masuk: now + 'T00:00:00.000Z',
                        deadline: deadlineVal + 'T23:59:59.999Z',
                        urgent: document.getElementById('rev_urgent_' + i).checked,
                        catatan: 'Bulk Input'
                    });
                    savedCount++;
                }
            }
        }
        if (savedCount > 0) {
            window.Utils.showToast(savedCount + ' paket berhasil disimpan', 'success');
            if (window.AuditLog) window.AuditLog.log('BULK_CREATE', 'package', { count: savedCount });
        } else {
            window.Utils.showToast('Tidak ada data yang disimpan (Nama & PIN wajib)', 'warning');
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
