// js/pickup.js

const Pickup = {
    currentTripId: null,
    tripPackages: [],
    skippedPackages: new Set(),
    renderedTripId: null,
    _lastScannedAWB: null,
    _lastScanTime: 0,
    currentStoreIndex: 0,
    storeKeys: [],
    _touchStartX: 0,
    _touchStartY: 0,
    _touchCurrentX: 0,
    _isSwiping: false,
    _swipeThreshold: 80,
    
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
                <div id="pickup-header" style="position: sticky; top: 0; background: var(--color-bg); z-index: 10; padding: 1rem 0; border-bottom: 1px solid var(--color-surface-2);">
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
                    
                    <div id="pickup-store-nav" style="display: none;"></div>
                </div>
                <div id="pickup-swipe-wrapper" style="position: relative; overflow: hidden; touch-action: pan-y;">
                    <div id="pickup-list-container" style="display: flex; transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);"></div>
                </div>
            `;

            // Bind swipe events
            this._bindSwipeEvents();
        }

        this.renderContent();
    },

    _bindSwipeEvents: function() {
        const wrapper = document.getElementById('pickup-swipe-wrapper');
        if (!wrapper) return;

        const self = this;

        wrapper.addEventListener('touchstart', function(e) {
            if (self.storeKeys.length <= 1) return;
            self._touchStartX = e.touches[0].clientX;
            self._touchStartY = e.touches[0].clientY;
            self._touchCurrentX = self._touchStartX;
            self._isSwiping = false;

            const slider = document.getElementById('pickup-list-container');
            if (slider) {
                slider.style.transition = 'none';
            }
        }, { passive: true });

        wrapper.addEventListener('touchmove', function(e) {
            if (self.storeKeys.length <= 1) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - self._touchStartX;
            const diffY = currentY - self._touchStartY;

            // Determine if this is a horizontal swipe (only on first significant move)
            if (!self._isSwiping && Math.abs(diffX) > 10) {
                // Only engage if horizontal movement dominates vertical
                if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
                    self._isSwiping = true;
                }
            }

            if (self._isSwiping) {
                self._touchCurrentX = currentX;
                const slider = document.getElementById('pickup-list-container');
                if (slider) {
                    const baseOffset = -self.currentStoreIndex * wrapper.offsetWidth;
                    // Add resistance at edges
                    let drag = diffX;
                    if ((self.currentStoreIndex === 0 && diffX > 0) ||
                        (self.currentStoreIndex === self.storeKeys.length - 1 && diffX < 0)) {
                        drag = diffX * 0.3; // rubber band effect
                    }
                    slider.style.transform = `translateX(${baseOffset + drag}px)`;
                }
            }
        }, { passive: true });

        wrapper.addEventListener('touchend', function(e) {
            if (!self._isSwiping || self.storeKeys.length <= 1) {
                self._isSwiping = false;
                return;
            }

            const diff = self._touchCurrentX - self._touchStartX;
            const slider = document.getElementById('pickup-list-container');
            if (slider) {
                slider.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }

            if (Math.abs(diff) > self._swipeThreshold) {
                if (diff > 0 && self.currentStoreIndex > 0) {
                    self.currentStoreIndex--;
                } else if (diff < 0 && self.currentStoreIndex < self.storeKeys.length - 1) {
                    self.currentStoreIndex++;
                }
            }

            self._snapToCurrentStore();
            self._isSwiping = false;
        }, { passive: true });
    },

    _snapToCurrentStore: function() {
        const wrapper = document.getElementById('pickup-swipe-wrapper');
        const slider = document.getElementById('pickup-list-container');
        if (!wrapper || !slider) return;

        const offset = -this.currentStoreIndex * wrapper.offsetWidth;
        slider.style.transform = `translateX(${offset}px)`;

        this._updateStoreNav();
    },

    _updateStoreNav: function() {
        const nav = document.getElementById('pickup-store-nav');
        if (!nav || this.storeKeys.length <= 1) {
            if (nav) nav.style.display = 'none';
            return;
        }

        nav.style.display = 'block';

        const stores = window.DB.getAllStores();
        const storeMap = {};
        stores.forEach(s => storeMap[s.kode_toko] = s);

        let dotsHtml = '<div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 0;">';
        
        // Left arrow
        dotsHtml += `<span onclick="Pickup.goToStore(${this.currentStoreIndex - 1})" 
            style="cursor: pointer; font-size: 1.2rem; opacity: ${this.currentStoreIndex > 0 ? '1' : '0.2'}; 
            padding: 0.25rem; user-select: none;">◀</span>`;

        // Store name
        const currentStoreId = this.storeKeys[this.currentStoreIndex];
        const storeName = storeMap[currentStoreId] ? storeMap[currentStoreId].nama_toko : 'Toko Tidak Diketahui';
        dotsHtml += `<span style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary); text-align: center; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            🏪 ${window.Utils.escapeHtml(storeName)}
        </span>`;

        // Right arrow
        dotsHtml += `<span onclick="Pickup.goToStore(${this.currentStoreIndex + 1})" 
            style="cursor: pointer; font-size: 1.2rem; opacity: ${this.currentStoreIndex < this.storeKeys.length - 1 ? '1' : '0.2'}; 
            padding: 0.25rem; user-select: none;">▶</span>`;

        dotsHtml += '</div>';

        // Dots
        dotsHtml += '<div style="display: flex; justify-content: center; gap: 0.35rem; padding-bottom: 0.25rem;">';
        this.storeKeys.forEach((key, i) => {
            const isActive = i === this.currentStoreIndex;
            dotsHtml += `<span onclick="Pickup.goToStore(${i})" 
                style="width: ${isActive ? '20px' : '6px'}; height: 6px; border-radius: 3px; 
                background: ${isActive ? 'var(--color-primary)' : 'var(--color-surface-2)'}; 
                transition: all 0.3s ease; cursor: pointer;"></span>`;
        });
        dotsHtml += '</div>';

        nav.innerHTML = dotsHtml;
    },

    goToStore: function(index) {
        if (index < 0 || index >= this.storeKeys.length) return;
        this.currentStoreIndex = index;

        const slider = document.getElementById('pickup-list-container');
        if (slider) {
            slider.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }

        this._snapToCurrentStore();
    },

    renderContent: function() {
        const listContainer = document.getElementById('pickup-list-container');
        const wrapper = document.getElementById('pickup-swipe-wrapper');
        if (!listContainer || !wrapper) return;

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

        // Build store keys array for navigation
        this.storeKeys = Object.keys(grouped);
        
        // Clamp currentStoreIndex
        if (this.currentStoreIndex >= this.storeKeys.length) {
            this.currentStoreIndex = Math.max(0, this.storeKeys.length - 1);
        }

        const wrapperWidth = wrapper.offsetWidth;

        let html = '';

        for (const [storeId, storePkgs] of Object.entries(grouped)) {
            const storeName = storeMap[storeId] ? storeMap[storeId].nama_toko : 'Toko Tidak Diketahui';

            // Calculate per-store progress
            const storePickedUp = storePkgs.filter(p => p.status === 'picked_up').length;
            const storeTotal = storePkgs.length;
            const storeProgressPct = storeTotal === 0 ? 0 : Math.round((storePickedUp / storeTotal) * 100);
            
            html += `
                <div class="pickup-store-slide" style="flex: 0 0 ${wrapperWidth}px; width: ${wrapperWidth}px; padding: 0 0.25rem; overflow-y: auto;">
                    <div class="card glassmorphism" style="margin-bottom: 0; padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px dashed var(--color-surface-2); padding-bottom: 0.5rem;">
                            <h3 style="font-size: 1.1rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; color: var(--color-primary);">
                                🏪 ${window.Utils.escapeHtml(storeName)}
                            </h3>
                            <span class="badge" style="background-color: var(--color-surface-2); color: var(--color-text-muted);">${storePickedUp}/${storeTotal} paket</span>
                        </div>
                        <div style="width: 100%; background-color: var(--color-surface-2); border-radius: 4px; height: 4px; overflow: hidden; margin-bottom: 1rem;">
                            <div style="height: 100%; width: ${storeProgressPct}%; background-color: ${storeProgressPct === 100 ? 'var(--color-success)' : 'var(--color-primary)'}; transition: width 0.3s ease;"></div>
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

            html += `</div></div></div>`;
        }

        listContainer.innerHTML = html;

        // Snap to current store position (no animation during render)
        const slider = document.getElementById('pickup-list-container');
        if (slider) {
            slider.style.transition = 'none';
            const offset = -this.currentStoreIndex * wrapperWidth;
            slider.style.transform = `translateX(${offset}px)`;
            // Re-enable transition after paint
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    slider.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                });
            });
        }

        // Update store nav
        this._updateStoreNav();

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
                // Auto-navigate to the store that contains this package
                const storeId = pkg.store_id || 'unknown';
                const storeIdx = this.storeKeys.indexOf(storeId);
                if (storeIdx !== -1 && storeIdx !== this.currentStoreIndex) {
                    this.goToStore(storeIdx);
                }
                this.handlePickedUp(pkg.id);
            } else {
                window.Utils.showToast('Paket ini sudah diambil', 'warning');
            }
        } else {
            window.Utils.showToast('AWB tidak ditemukan di trip ini', 'danger');
        }
    },

    handleCompleteTrip: function() {
        // Complete the current trip
        if (this.currentTripId) {
            window.DB.completeTrip(this.currentTripId);
        }

        // Also complete any other orphaned active trips to prevent
        // the Trip menu from redirecting back to pickup mode
        const allTrips = window.DB.getAllTrips();
        allTrips.forEach(function(t) {
            if (t.status === 'active') {
                window.DB.completeTrip(t.id);
            }
        });

        if (window.Barcode) window.Barcode.stopScanner();

        if (window.AuditLog) window.AuditLog.log('COMPLETE_TRIP', 'trip', { trip_id: this.currentTripId, packages: this.tripPackages.length });

        // Clear all pickup state
        this.renderedTripId = null;
        this.currentTripId = null;
        this.tripPackages = [];
        this.skippedPackages.clear();
        this.currentStoreIndex = 0;
        this.storeKeys = [];

        window.Utils.showToast('Trip Selesai!', 'success');
        window.location.hash = '#dashboard';
    }
};

window.Pickup = Pickup;
