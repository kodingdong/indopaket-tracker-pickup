// js/dashboard.js

const Dashboard = {
    currentFilter: 'pending',
    searchQuery: '',
    accordionState: {},

    init: function() {
        this.accordionState = {};
        this.render();
    },

    render: function() {
        const container = document.getElementById('view-dashboard');
        if (!container) return;

        // Header & Alert
        const stats = window.DB.getStats();
        const urgentPackages = window.DB.getUrgentPackages();
        const needsAlert = urgentPackages.length > 0;

        const cfg = window.SyncEngine ? window.SyncEngine.getConfig() : {};
        const roleText = cfg.role === 'picker' ? '🛵 Picker' : cfg.role === 'admin' ? '🖥️ Admin' : '📥 Input';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <h2 style="font-size: 1.5rem; margin: 0;">Dashboard</h2>
                    <span class="badge" style="background: var(--color-surface-2); color: var(--color-text); font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 8px;">${roleText}</span>
                </div>
                <button class="btn" style="background-color: var(--color-surface-2); color: white; width: auto; padding: 0.5rem 1rem;" onclick="window.location.hash='#stores'">Kelola Toko</button>
            </div>
        `;

        if (window.Reminder) {
            const summaryText = window.Reminder.getDailySummary();
            if (summaryText) {
                const isUrgent = summaryText.includes('segera') || summaryText.includes('retur');
                html += `
                    <div class="card glassmorphism slideUp" style="background-color: ${isUrgent ? 'rgba(255, 59, 92, 0.1)' : 'rgba(46, 204, 113, 0.1)'}; border-left: 4px solid ${isUrgent ? 'var(--color-urgent)' : 'var(--color-success)'}; margin-bottom: 1rem; padding: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: ${isUrgent ? 'var(--color-urgent)' : 'var(--color-success)'}; font-weight: bold;">${isUrgent ? '⚠️ Peringatan:' : '✨ Info:'}</span>
                            <span>${summaryText}</span>
                        </div>
                    </div>
                `;
            }
        } else if (needsAlert) {
            html += `
                <div class="card glassmorphism slideUp" style="background-color: rgba(255, 59, 92, 0.1); border-left: 4px solid var(--color-urgent); margin-bottom: 1rem; padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--color-urgent); font-weight: bold;">⚠️ Peringatan:</span>
                        <span>Ada ${urgentPackages.length} paket yang harus segera diambil (<= 2 hari)!</span>
                    </div>
                </div>
            `;
        }

        // Summary Bar
        html += `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
                <div class="card glassmorphism" style="text-align: center; padding: 0.75rem; cursor: pointer; border: 1px solid ${this.currentFilter === 'all' ? 'var(--color-primary)' : 'transparent'};" onclick="Dashboard.setFilter('all')">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${stats.totalPackages}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">Total</div>
                </div>
                <div class="card glassmorphism" style="text-align: center; padding: 0.75rem; cursor: pointer; border: 1px solid ${this.currentFilter === 'pending' ? 'var(--color-warning)' : 'transparent'};" onclick="Dashboard.setFilter('pending')">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-warning);">${stats.pendingCount}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">Pending</div>
                </div>
                <div class="card glassmorphism" style="text-align: center; padding: 0.75rem; cursor: pointer; border: 1px solid ${this.currentFilter === 'urgent' ? 'var(--color-urgent)' : 'transparent'};" onclick="Dashboard.setFilter('urgent')">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-urgent);">${stats.urgentCount}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">Urgent</div>
                </div>
            </div>
        `;

        // Search Bar
        html += `
            <div class="form-group" style="margin-bottom: 1rem;">
                <input type="text" id="dashboard-search" placeholder="Cari Nama / AWB / PIN..." value="${this.searchQuery}" 
                    style="width: 100%; padding: 0.75rem 1rem; border-radius: 24px; border: 1px solid var(--color-surface-2); background-color: var(--color-bg); color: var(--color-text);">
            </div>
        `;

        // Filter Tabs
        const filters = [
            { id: 'all', label: 'Semua' },
            { id: 'pending', label: 'Pending' },
            { id: 'urgent', label: 'Urgent' },
            { id: 'picked_up', label: 'Diambil' },
            { id: 'returned', label: 'Retur' }
        ];

        let tabsHtml = `<div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1rem; scrollbar-width: none;">`;
        filters.forEach(f => {
            const isActive = this.currentFilter === f.id;
            tabsHtml += `
                <button class="badge" 
                    style="border: none; cursor: pointer; padding: 0.5rem 1rem; border-radius: 16px; white-space: nowrap;
                    background-color: ${isActive ? 'var(--color-primary)' : 'var(--color-surface-2)'}; 
                    color: ${isActive ? '#fff' : 'var(--color-text-muted)'};"
                    onclick="Dashboard.setFilter('${f.id}')">
                    ${f.label}
                </button>
            `;
        });
        tabsHtml += `</div>`;
        html += tabsHtml;

        // Package List Container
        html += `<div id="dashboard-package-list"></div>`;

        // FAB
        html += `
            <a href="#add" class="fab slideUp" style="position: fixed; bottom: 80px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background-color: var(--color-primary); color: white; display: flex; justify-content: center; align-items: center; text-decoration: none; box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4); z-index: 90;">
                <span style="font-size: 24px; line-height: 1;">+</span>
            </a>
        `;

        container.innerHTML = html;

        // Bind Search Events using existing debounce from Utils
        const searchInput = document.getElementById('dashboard-search');
        if (searchInput) {
            searchInput.addEventListener('input', window.Utils.debounce((e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderPackageList();
            }, 300));
        }

        this.renderPackageList();
    },

    setFilter: function(filter) {
        this.currentFilter = filter;
        this.render(); // Re-render everything to update active tab style
    },

    toggleAccordion: function(storeId) {
        const content = document.getElementById('acc-content-' + storeId);
        const icon = document.getElementById('acc-icon-' + storeId);
        if (!content) return;
        
        if (content.style.display === 'none') {
            content.style.display = 'flex';
            if (icon) icon.innerText = '▲';
            this.accordionState[storeId] = true;
        } else {
            content.style.display = 'none';
            if (icon) icon.innerText = '▼';
            this.accordionState[storeId] = false;
        }
    },

    renderPackageList: function() {
        const container = document.getElementById('dashboard-package-list');
        if (!container) return;

        let packages = [];

        if (this.searchQuery) {
            packages = window.DB.searchPackages(this.searchQuery);
            if (this.currentFilter !== 'all') {
                if (this.currentFilter === 'urgent') {
                    packages = packages.filter(p => p.status === 'pending' && (p.urgent || window.Utils.daysUntilDeadline(p.deadline) <= 1));
                } else {
                    packages = packages.filter(p => p.status === this.currentFilter);
                }
            }
        } else {
            switch (this.currentFilter) {
                case 'all':
                    packages = window.DB.getAllPackages();
                    break;
                case 'pending':
                    packages = window.DB.getPendingPackages();
                    break;
                case 'urgent':
                    packages = window.DB.getUrgentPackages();
                    break;
                case 'picked_up':
                    packages = window.DB.getPackagesByStatus('picked_up');
                    break;
                case 'returned':
                    packages = window.DB.getPackagesByStatus('returned');
                    break;
            }
        }

        // Apply daily reset filter (only pending, or picked_up/returned today)
        const todayStr = new Date().toISOString().split('T')[0];
        packages = packages.filter(p => {
            if (p.status === 'pending') return true;
            if (!p.tanggal_pickup) return false;
            return p.tanggal_pickup.split('T')[0] === todayStr;
        });

        if (packages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📦</div>
                    <p>Tidak ada paket yang ditemukan.</p>
                </div>
            `;
            return;
        }

        // Group by Store
        const stores = window.DB.getAllStores();
        const storeMap = {};
        stores.forEach(s => storeMap[s.kode_toko] = s);

        const grouped = {};
        packages.forEach(p => {
            const storeId = p.store_id || 'unknown';
            if (!grouped[storeId]) grouped[storeId] = [];
            grouped[storeId].push(p);
        });

        let html = '';
        var idx = 0;
        
        for (const [storeId, pkgs] of Object.entries(grouped)) {
            const store = storeMap[storeId];
            const storeCodeLabel = store ? ' (' + store.kode_toko + ')' : '';
            const storeName = store ? store.nama_toko + storeCodeLabel : 'Toko Tidak Diketahui';
            
            // Sort packages within store if not already sorted by pending (pending is pre-sorted)
            if (this.currentFilter !== 'pending' && this.currentFilter !== 'urgent') {
                pkgs.sort((a, b) => {
                    const daysA = window.Utils.daysUntilDeadline(a.deadline);
                    const daysB = window.Utils.daysUntilDeadline(b.deadline);
                    if (daysA !== daysB) return daysA - daysB;
                    return new Date(a.created_at) - new Date(b.created_at);
                });
            }

            // Accordion expand/collapse state
            let isExpanded = false;
            if (this.accordionState[storeId] !== undefined) {
                isExpanded = this.accordionState[storeId];
            } else if (idx === 0) {
                isExpanded = true;
                this.accordionState[storeId] = true;
            }

            html += `
                <div style="margin-bottom: 0.75rem;" class="fadeIn">
                    <h3 class="accordion-header" onclick="Dashboard.toggleAccordion('${storeId}')" 
                        style="font-size: 1rem; margin: 0; padding: 0.75rem; background: var(--color-surface-2); border-radius: var(--radius); cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>🏪</span> ${storeName}
                            <span class="badge" style="background-color: var(--color-primary); color: white;">${pkgs.length}</span>
                        </div>
                        <span class="accordion-icon" id="acc-icon-${storeId}" style="font-size: 0.8rem;">${isExpanded ? '▲' : '▼'}</span>
                    </h3>
                    <div class="accordion-content store-carousel" id="acc-content-${storeId}" 
                        style="display: ${isExpanded ? 'flex' : 'none'};">
            `;

            pkgs.forEach(p => {
                const daysRemaining = window.Utils.daysUntilDeadline(p.deadline);
                const isUrgent = p.urgent || (p.status === 'pending' && daysRemaining <= 1);
                
                let statusClass = 'warning';
                let statusText = '';
                
                if (p.status === 'picked_up') {
                    statusClass = 'success';
                    statusText = 'Diambil';
                } else if (p.status === 'returned') {
                    statusClass = 'danger';
                    statusText = 'Retur';
                } else {
                    statusClass = isUrgent ? 'urgent' : 'warning';
                    statusText = window.Utils.getDeadlineStatus(daysRemaining);
                }

                html += `
                    <div class="card glassmorphism" style="margin-bottom: 0; cursor: pointer; padding: 1rem; border-left: 3px solid var(--color-${statusClass}); transition: transform 0.2s;" onclick="window.location.hash='#package-detail?id=${p.id}'">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <h4 style="font-size: 1rem; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${p.nama}</h4>
                            <span class="badge badge-${statusClass}" style="white-space: nowrap;">${statusText}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="color: var(--color-text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">AWB: ${p.nomor_awb || '-'}</p>
                                <p style="color: var(--color-text-muted); font-size: 0.75rem; margin-bottom: 0.5rem;">PIN: <span style="font-weight: 600; color: var(--color-text);">${p.pin}</span></p>
                                <div style="background: white; padding: 0.25rem; border-radius: 4px; display: inline-block;">
                                    <canvas id="barcode-dash-${p.id}" style="height: 30px;"></canvas>
                                </div>
                                <div style="background: white; padding: 0.25rem; border-radius: 4px; display: inline-block; margin-left: 0.25rem;">
                                    <canvas id="barcode-pin-dash-${p.id}" style="height: 30px;"></canvas>
                                </div>
                            </div>
                            ${p.status === 'pending' ? `
                            <div style="text-align: right;">
                                <p style="color: var(--color-text-muted); font-size: 0.7rem; margin-bottom: 0.1rem;">Batas Pengambilan</p>
                                <p style="font-size: 0.85rem; font-weight: 500; color: ${isUrgent ? 'var(--color-urgent)' : 'var(--color-text)'};">${window.Utils.formatDate(p.deadline)}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            html += `<div class="carousel-dots" id="dots-${storeId}" style="text-align:center; padding:0.5rem 0;"></div>`;
            html += `</div>`;
            idx++;
        }

        container.innerHTML = html;

        // Render barcodes
        if (window.Barcode) {
            setTimeout(() => {
                packages.forEach(p => {
                    if (p.nomor_awb) {
                        window.Barcode.generateBarcode(p.nomor_awb, `barcode-dash-${p.id}`);
                    }
                    if (p.pin) {
                        window.Barcode.generateBarcode(p.pin, `barcode-pin-dash-${p.id}`);
                    }
                });
                for (const storeId of Object.keys(grouped)) {
                    Dashboard.initCarouselDots(storeId, grouped[storeId].length);
                }
            }, 50);
        }
    },

    initCarouselDots: function(storeId, count) {
        var dotsEl = document.getElementById('dots-' + storeId);
        var carousel = document.getElementById('acc-content-' + storeId);
        if (!dotsEl || !carousel || count <= 1) return;
        
        var dotsHtml = '';
        for (var i = 0; i < count; i++) {
            dotsHtml += '<span class="carousel-dot' + (i === 0 ? ' active' : '') + '"></span>';
        }
        dotsEl.innerHTML = dotsHtml;
        
        carousel.addEventListener('scroll', function() {
            var scrollLeft = carousel.scrollLeft;
            var cardWidth = carousel.children[0] ? carousel.children[0].offsetWidth + 12 : 1;
            var activeIdx = Math.round(scrollLeft / cardWidth);
            var dots = dotsEl.querySelectorAll('.carousel-dot');
            dots.forEach(function(d, i) {
                d.classList.toggle('active', i === activeIdx);
            });
        });
    }
};

window.Dashboard = Dashboard;
