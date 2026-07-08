// js/pickup.js

const Pickup = {
    currentTripId: null,
    tripPackages: [],
    skippedPackages: new Set(),
    renderedTripId: null,
    _lastScannedAWB: null,
    _lastScanTime: 0,
    
    render: function(tripId) {
        const container = document.getElementById('view-pickup');
        if (!container) return;

        if (!tripId) {
            container.innerHTML = `<p style="text-align:center; margin-top:2rem;">Trip tidak ditemukan.</p>`;
            return;
        }

        const trips = window.DB.getAllTrips();
        const trip = trips.find(t => t.id === tripId);
        if (!trip) {
            container.innerHTML = `<p style="text-align:center; margin-top:2rem;">Trip tidak valid.</p>`;
            return;
        }

        this.currentTripId = tripId;
        
        // Fetch full package objects
        const allPackages = window.DB.getAllPackages();
        this.tripPackages = trip.packages.map(id => {
            return allPackages.find(p => p.id === id);
        }).filter(p => p !== undefined);

        // Render skeleton only if not already rendered for this trip
        if (!document.getElementById('pickup-header') || this.renderedTripId !== tripId) {
            this.renderedTripId = tripId;
            // Stop scanner if active from previous trip/view
            if (window.Barcode) window.Barcode.stopScanner();
            
            container.innerHTML = `
                <div id="pickup-header" style="position: sticky; top: 0; background: var(--color-bg); z-index: 10; padding: 1rem 0; margin-bottom: 1rem; border-bottom: 1px solid var(--color-surface-2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h2 style="font-size: 1.5rem; margin: 0;">Mode Pickup</h2>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn" id="btn-toggle-scanner" style="background-color: var(--color-primary); color: white; padding: 0.5rem 1rem; width: auto;" onclick="Pickup.toggleScanner()">📷 Scan</button>
                            <button class="btn" id="btn-complete-trip" style="color: white; padding: 0.5rem 1rem; width: auto;" onclick="Pickup.handleCompleteTrip()">
                                Akhiri Trip
                            </button>
                        </div>
                    </div>
                    <div id="pickup-scanner-container" style="display: none; margin-bottom: 1rem; border-radius: 8px; overflow: hidden; background: #000;"></div>

                    <div style="width: 100%; background-color: var(--color-surface-2); border-radius: 8px; height: 8px; overflow: hidden;">
                        <div id="pickup-progress-bar" style="height: 100%; width: 0%; background-color: var(--color-primary); transition: width 0.3s ease;"></div>
                    </div>
                    <p id="pickup-progress-text" style="text-align: right; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem;">Progress: 0/0</p>
                </div>
                <div id="pickup-list-container" style="display: flex; flex-direction: column; gap: 1.5rem;"></div>
            `;
        }

        this.renderContent();
    },

    renderContent: function() {
        const listContainer = document.getElementById('pickup-list-container');
        if (!listContainer) return;

        // Calculate progress
        const total = this.tripPackages.length;
        let pickedUpCount = 0;
        this.tripPackages.forEach(p => {
            if (p.status === 'picked_up') pickedUpCount++;
        });
        
        const progressPercent = total === 0 ? 0 : Math.round((pickedUpCount / total) * 100);

        // Update progress bar
        const progressBar = document.getElementById('pickup-progress-bar');
        if (progressBar) {
            progressBar.style.width = progressPercent + '%';
        }
        
        const progressText = document.getElementById('pickup-progress-text');
        if (progressText) {
            progressText.textContent = `Progress: ${pickedUpCount}/${total}`;
        }

        // Update complete button style
        const completeBtn = document.getElementById('btn-complete-trip');
        if (completeBtn) {
            completeBtn.style.backgroundColor = progressPercent === 100 ? 'var(--color-success)' : 'var(--color-surface-2)';
            completeBtn.textContent = progressPercent === 100 ? 'Selesai ✓' : 'Akhiri Trip';
        }

        // Group by store
        const grouped = {};
        this.tripPackages.forEach(p => {
            const storeId = p.store_id || 'unknown';
            if (!grouped[storeId]) grouped[storeId] = [];
            grouped[storeId].push(p);
        });

        const stores = window.DB.getAllStores();
        const storeMap = {};
        stores.forEach(s => storeMap[s.kode_toko] = s);

        let html = '';

        for (const [storeId, storePkgs] of Object.entries(grouped)) {
            const storeName = storeMap[storeId] ? storeMap[storeId].nama_toko : 'Toko Tidak Diketahui';
            
            html += `
                <div class="card glassmorphism" style="margin-bottom: 0; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px dashed var(--color-surface-2); padding-bottom: 0.5rem;">
                        <h3 style="font-size: 1.1rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; color: var(--color-primary);">
                            🏪 ${storeName}
                        </h3>
                        <span class="badge" style="background-color: var(--color-surface-2); color: var(--color-text-muted);">${storePkgs.length} paket</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
            `;

            storePkgs.forEach(p => {
                const daysRemaining = window.Utils.daysUntilDeadline(p.deadline);
                const isUrgent = p.urgent || daysRemaining <= 1;
                const isPickedUp = p.status === 'picked_up';
                const isSkipped = this.skippedPackages.has(p.id);
                
                const cardOpacity = (isPickedUp || isSkipped) ? '0.5' : '1';
                const cardBg = isPickedUp ? 'rgba(46, 204, 113, 0.1)' : 'var(--color-bg)';
                const borderLeft = isPickedUp ? '4px solid var(--color-success)' : (isUrgent ? '4px solid var(--color-urgent)' : '4px solid var(--color-primary)');
                
                html += `
                    <div id="pickup-card-${p.id}" style="background: ${cardBg}; border-radius: var(--radius); border: 1px solid var(--color-surface-2); border-left: ${borderLeft}; padding: 1rem; opacity: ${cardOpacity}; transition: all 0.3s ease;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted);">${window.Utils.escapeHtml(p.nama)}</span>
                            ${isUrgent && !isPickedUp && !isSkipped ? '<span class="badge badge-urgent">Urgent</span>' : ''}
                            ${isPickedUp ? '<span class="badge badge-success">Diambil ✓</span>' : ''}
                            ${isSkipped && !isPickedUp ? '<span class="badge badge-warning">Skipped</span>' : ''}
                        </div>
                        
                        <div style="text-align: center; margin: 1rem 0;">
                            <div style="font-size: 56px; font-weight: 800; letter-spacing: 2px; line-height: 1; ${isPickedUp ? 'text-decoration: line-through; color: var(--color-success);' : 'color: var(--color-text);'}">${window.Utils.escapeHtml(p.pin)}</div>
                            <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0.5rem;">AWB: ${window.Utils.escapeHtml(p.nomor_awb || '-')}</div>
                            <div style="margin-top: 0.5rem; background: white; padding: 0.5rem; border-radius: var(--radius); display: inline-block;">
                                <canvas id="barcode-pickup-${p.id}"></canvas>
                            </div>
                            <div style="margin-top: 0.5rem; background: white; padding: 0.5rem; border-radius: var(--radius); display: inline-block; margin-left: 0.5rem;">
                                <canvas id="barcode-pin-pickup-${p.id}"></canvas>
                            </div>
                        </div>

                        ${(!isPickedUp) ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="Pickup.handlePickedUp('${p.id}')">Diambil</button>
                            <button class="btn" style="background-color: var(--color-surface-2); color: white;" onclick="Pickup.handleSkip('${p.id}')">${isSkipped ? 'Unskip' : 'Skip'}</button>
                        </div>
                        ` : `
                        <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-top: 1rem;">
                            <button class="btn" style="background-color: var(--color-surface-2); color: white;" onclick="Pickup.handleUndoPickedUp('${p.id}')">Batal (Undo)</button>
                        </div>
                        `}
                    </div>
                `;
            });

            html += `</div></div>`;
        }

        listContainer.innerHTML = html;

        // Generate barcodes
        if (window.Barcode) {
            setTimeout(() => {
                this.tripPackages.forEach(p => {
                    if (p.nomor_awb) {
                        window.Barcode.generateBarcode(p.nomor_awb, `barcode-pickup-${p.id}`);
                    }
                    if (p.pin) {
                        window.Barcode.generateBarcode(p.pin, `barcode-pin-pickup-${p.id}`);
                    }
                });
            }, 50);
        }
    },

    handlePickedUp: function(packageId) {
        window.DB.markAsPickedUp(packageId);
        this.skippedPackages.delete(packageId); // remove from skip if picked up
        
        // Update local state to reflect change immediately
        const pkgIndex = this.tripPackages.findIndex(p => p.id === packageId);
        if (pkgIndex > -1) {
            this.tripPackages[pkgIndex].status = 'picked_up';
        }

        // Haptic feedback if supported
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        window.Utils.showToast('Paket ditandai Diambil', 'success');
        if (window.AuditLog) {
            var pkg = this.tripPackages.find(function(p) { return p.id === packageId; });
            window.AuditLog.log('PICKUP_PACKAGE', 'package', { nama: pkg ? pkg.nama : '', nomor_awb: pkg ? pkg.nomor_awb : '', via: 'trip_pickup' });
        }
        this.renderContent();
    },

    handleUndoPickedUp: function(packageId) {
        // Just revert status to pending
        window.DB.updatePackage(packageId, { status: 'pending', tanggal_pickup: null });
        const pkgIndex = this.tripPackages.findIndex(p => p.id === packageId);
        if (pkgIndex > -1) {
            this.tripPackages[pkgIndex].status = 'pending';
        }
        this.renderContent();
    },

    handleSkip: function(packageId) {
        if (this.skippedPackages.has(packageId)) {
            this.skippedPackages.delete(packageId);
        } else {
            this.skippedPackages.add(packageId);
            window.Utils.showToast('Paket dilewati (Skip)', 'warning');
        }
        this.renderContent();
    },

    toggleScanner: function() {
        const container = document.getElementById('pickup-scanner-container');
        const btn = document.getElementById('btn-toggle-scanner');
        
        if (container.style.display === 'none') {
            container.style.display = 'block';
            btn.innerHTML = 'Tutup Scanner';
            if (window.Barcode) {
                window.Barcode.startScanner('pickup-scanner-container', (awb) => {
                    this.handleScanResult(awb);
                });
            }
        } else {
            container.style.display = 'none';
            btn.innerHTML = '📷 Scan';
            if (window.Barcode) {
                window.Barcode.stopScanner();
            }
        }
    },

    handleScanResult: function(awb) {
        if (!awb) return;
        
        const now = Date.now();
        // 3 seconds cooldown for identical AWB, 1.5 seconds general cooldown
        if (awb === this._lastScannedAWB && (now - this._lastScanTime < 3000)) {
            console.log('Ignore scan - duplicate/cooldown');
            return;
        }
        if (now - this._lastScanTime < 1500) {
            console.log('Ignore scan - too fast');
            return;
        }
        
        this._lastScannedAWB = awb;
        this._lastScanTime = now;

        // Find package in current trip
        const pkg = this.tripPackages.find(p => p.nomor_awb === awb);
        if (pkg) {
            if (pkg.status !== 'picked_up') {
                this.handlePickedUp(pkg.id);
            } else {
                window.Utils.showToast('Paket ini sudah diambil', 'warning');
            }
        } else {
            window.Utils.showToast('AWB tidak ditemukan di trip ini', 'danger');
        }
    },

    handleCompleteTrip: function() {
        if (this.currentTripId) {
            window.DB.completeTrip(this.currentTripId);
        }
        if (window.Barcode) window.Barcode.stopScanner();
        this.renderedTripId = null;
        window.Utils.showToast('Trip Selesai!', 'success');
        if (window.AuditLog) window.AuditLog.log('COMPLETE_TRIP', 'trip', { trip_id: this.currentTripId, packages: this.tripPackages.length });
        window.location.hash = '#dashboard';
    }
};

window.Pickup = Pickup;
