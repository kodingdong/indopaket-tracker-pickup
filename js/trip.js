// js/trip.js
const Trip = {
    selectedPackages: new Set(),
    capacity: 5,
    
    render: function() {
        const container = document.getElementById('view-trip');
        if (!container) return;

        let pkgs = window.DB.getPendingPackages();
        const stores = window.DB.getAllStores();
        const storeMap = {};
        stores.forEach(s => storeMap[s.id] = s);

        // Group by store
        const grouped = {};
        pkgs.forEach(p => {
            const storeId = p.store_id || 'unknown';
            if (!grouped[storeId]) grouped[storeId] = [];
            grouped[storeId].push(p);
        });

        // Auto select urgent if we haven't selected anything yet and this is a fresh render
        if (this.selectedPackages.size === 0 && pkgs.length > 0) {
            pkgs.forEach(p => {
                const isUrgent = p.urgent || window.Utils.daysUntilDeadline(p.deadline) <= 1;
                if (isUrgent && this.selectedPackages.size < this.capacity) {
                    this.selectedPackages.add(p.id);
                }
            });
        }

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="font-size: 1.5rem;">Trip Planner</h2>
            </div>
            
            <div class="card glassmorphism" style="margin-bottom: 1rem; padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <label style="font-weight: 600;">Kapasitas Motor</label>
                    <input type="number" id="trip-capacity" value="${this.capacity}" min="1" max="20" style="width: 80px; padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background: var(--color-bg); color: var(--color-text); text-align: center;" onchange="Trip.handleCapacityChange(this.value)">
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--color-text-muted);">Paket Terpilih</span>
                    <span style="font-size: 1.25rem; font-weight: 700; color: ${this.selectedPackages.size >= this.capacity ? 'var(--color-urgent)' : 'var(--color-primary)'};">
                        Selected: ${this.selectedPackages.size}/${this.capacity}
                    </span>
                </div>
                <button class="btn btn-primary" style="margin-top: 1rem; width: 100%; opacity: ${this.selectedPackages.size > 0 ? '1' : '0.5'};" onclick="Trip.handleStartTrip()" ${this.selectedPackages.size === 0 ? 'disabled' : ''}>Mulai Trip Sekarang</button>
            </div>
        `;

        if (pkgs.length === 0) {
            html += `<p style="text-align: center; color: var(--color-text-muted); margin-top: 2rem;">Tidak ada paket pending.</p>`;
            container.innerHTML = html;
            return;
        }

        html += `<div style="display: flex; flex-direction: column; gap: 1rem;">`;

        for (const [storeId, storePkgs] of Object.entries(grouped)) {
            const storeName = storeMap[storeId] ? storeMap[storeId].nama_toko : 'Toko Tidak Diketahui';
            
            // Check if all are selected (within capacity constraints? Just visual check if all available in this store are selected)
            const allSelected = storePkgs.length > 0 && storePkgs.every(p => this.selectedPackages.has(p.id));
            
            html += `
                <div class="card glassmorphism" style="margin-bottom: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--color-surface-2); padding-bottom: 0.5rem;">
                        <h3 style="font-size: 1rem; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                            🏪 ${storeName}
                        </h3>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <span style="font-size: 0.75rem; color: var(--color-text-muted);">Pilih Semua</span>
                            <input type="checkbox" ${allSelected ? 'checked' : ''} onclick="Trip.handleToggleStore('${storeId}', this.checked)" style="width: 18px; height: 18px; cursor: pointer;">
                        </label>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            `;

            storePkgs.forEach(p => {
                const daysRemaining = window.Utils.daysUntilDeadline(p.deadline);
                const isUrgent = p.urgent || daysRemaining <= 1;
                const isSelected = this.selectedPackages.has(p.id);
                const isFull = this.selectedPackages.size >= this.capacity;
                const isDisabled = !isSelected && isFull;

                html += `
                    <label style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--color-bg); border-radius: var(--radius); border: 1px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; opacity: ${isDisabled ? '0.5' : '1'}; transition: all 0.2s;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <input type="checkbox" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} onchange="Trip.handleTogglePackage('${p.id}', this.checked)" style="width: 18px; height: 18px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'};">
                            <div>
                                <h4 style="font-size: 0.9rem; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                    ${p.nama}
                                    ${isUrgent ? '<span class="badge badge-urgent" style="font-size: 0.6rem; padding: 0.1rem 0.3rem;">Urgent</span>' : ''}
                                </h4>
                                <p style="color: var(--color-text-muted); font-size: 0.75rem; margin-top: 0.25rem;">AWB: ${p.nomor_awb || '-'}</p>
                            </div>
                        </div>
                    </label>
                `;
            });

            html += `</div></div>`;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    handleCapacityChange: function(val) {
        let newCap = parseInt(val);
        if (isNaN(newCap) || newCap < 1) newCap = 1;
        this.capacity = newCap;
        
        // Remove selection if exceeding new capacity
        if (this.selectedPackages.size > this.capacity) {
            let toRemove = this.selectedPackages.size - this.capacity;
            const iter = this.selectedPackages.values();
            while(toRemove > 0) {
                const id = iter.next().value;
                this.selectedPackages.delete(id);
                toRemove--;
            }
        }
        
        this.render();
    },

    handleTogglePackage: function(packageId, isChecked) {
        if (isChecked) {
            if (this.selectedPackages.size < this.capacity) {
                this.selectedPackages.add(packageId);
            }
        } else {
            this.selectedPackages.delete(packageId);
        }
        this.render();
    },

    handleToggleStore: function(storeId, isChecked) {
        const pkgs = window.DB.getPackagesByStore(storeId).filter(p => p.status === 'pending');
        if (isChecked) {
            for (let p of pkgs) {
                if (!this.selectedPackages.has(p.id) && this.selectedPackages.size < this.capacity) {
                    this.selectedPackages.add(p.id);
                }
            }
        } else {
            pkgs.forEach(p => this.selectedPackages.delete(p.id));
        }
        this.render();
    },

    handleStartTrip: function() {
        if (this.selectedPackages.size === 0) {
            window.Utils.showToast('Pilih setidaknya 1 paket untuk trip', 'warning');
            return;
        }

        const tripData = {
            packages: Array.from(this.selectedPackages)
        };

        const trip = window.DB.createTrip(tripData);
        window.Utils.showToast('Trip dimulai!', 'success');
        if (window.AuditLog) window.AuditLog.log('CREATE_TRIP', 'trip', { trip_id: trip.id, packages: tripData.packages.length });
        
        this.selectedPackages.clear();
        
        // Navigate to pickup mode (task 8)
        window.location.hash = '#pickup?trip_id=' + trip.id;
    }
};

window.Trip = Trip;
