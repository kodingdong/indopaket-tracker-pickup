// js/history.js

const History = {
    currentTab: 'all', // 'all', 'picked_up', 'returned'
    searchQuery: '',
    dateFrom: '',
    dateTo: '',
    currentPage: 1,
    pageSize: 20,

    render: function() {
        const container = document.getElementById('view-history');
        if (!container) return;

        // Default date range: last 30 days to today
        if (!this.dateFrom) {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            this.dateFrom = d.toISOString().split('T')[0];
        }
        if (!this.dateTo) {
            this.dateTo = new Date().toISOString().split('T')[0];
        }

        const allPkgs = this._getFilteredPackages();
        const totalCount = allPkgs.length;
        const pickedCount = allPkgs.filter(p => p.status === 'picked_up').length;
        const returnedCount = allPkgs.filter(p => p.status === 'returned').length;

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="font-size: 1.5rem; margin: 0;">Histori</h2>
            </div>

            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
                <div class="card glassmorphism history-summary-card" style="text-align: center; padding: 0.75rem; cursor: pointer; border: 1px solid ${this.currentTab === 'all' ? 'var(--color-primary)' : 'transparent'};" onclick="History.setTab('all')">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${totalCount}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">Semua</div>
                </div>
                <div class="card glassmorphism history-summary-card" style="text-align: center; padding: 0.75rem; cursor: pointer; border: 1px solid ${this.currentTab === 'picked_up' ? 'var(--color-success)' : 'transparent'};" onclick="History.setTab('picked_up')">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">${pickedCount}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">Diambil</div>
                </div>
                <div class="card glassmorphism history-summary-card" style="text-align: center; padding: 0.75rem; cursor: pointer; border: 1px solid ${this.currentTab === 'returned' ? 'var(--color-danger)' : 'transparent'};" onclick="History.setTab('returned')">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-danger);">${returnedCount}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">Retur</div>
                </div>
            </div>

            <!-- Date Range Filter -->
            <div class="card glassmorphism" style="padding: 0.75rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.85rem; color: var(--color-text-muted);">📅 Rentang Tanggal</span>
                    <button class="badge" style="border: none; cursor: pointer; padding: 0.2rem 0.5rem; border-radius: 8px; background-color: var(--color-surface-2); color: var(--color-text-muted); font-size: 0.7rem;" onclick="History.setQuickRange('all')">Semua</button>
                    <button class="badge" style="border: none; cursor: pointer; padding: 0.2rem 0.5rem; border-radius: 8px; background-color: var(--color-surface-2); color: var(--color-text-muted); font-size: 0.7rem;" onclick="History.setQuickRange('week')">7 Hari</button>
                    <button class="badge" style="border: none; cursor: pointer; padding: 0.2rem 0.5rem; border-radius: 8px; background-color: var(--color-surface-2); color: var(--color-text-muted); font-size: 0.7rem;" onclick="History.setQuickRange('month')">30 Hari</button>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="date" id="history-date-from" value="${this.dateFrom}" 
                        style="flex: 1; padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background: var(--color-bg); color: var(--color-text); font-family: var(--font-main); font-size: 0.8rem;">
                    <span style="color: var(--color-text-muted); font-size: 0.8rem;">—</span>
                    <input type="date" id="history-date-to" value="${this.dateTo}" 
                        style="flex: 1; padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background: var(--color-bg); color: var(--color-text); font-family: var(--font-main); font-size: 0.8rem;">
                </div>
            </div>

            <!-- Search -->
            <div style="margin-bottom: 1rem;">
                <input type="text" id="history-search" class="input" placeholder="🔍 Cari nama, AWB, PIN..." value="${this.searchQuery}"
                    style="width: 100%; padding: 0.6rem 0.75rem; border-radius: var(--radius); border: 1px solid var(--color-surface-2); background: var(--color-bg); color: var(--color-text); font-size: 0.9rem;">
            </div>

            <!-- Package List -->
            <div id="history-package-list"></div>
        `;

        container.innerHTML = html;

        // Bind events
        const dateFrom = document.getElementById('history-date-from');
        const dateTo = document.getElementById('history-date-to');
        const searchInput = document.getElementById('history-search');

        if (dateFrom) {
            dateFrom.addEventListener('change', function() {
                History.dateFrom = this.value;
                History.currentPage = 1;
                History.renderPackageList();
            });
        }
        if (dateTo) {
            dateTo.addEventListener('change', function() {
                History.dateTo = this.value;
                History.currentPage = 1;
                History.renderPackageList();
            });
        }
        if (searchInput) {
            searchInput.addEventListener('input', window.Utils.debounce(function(e) {
                History.searchQuery = e.target.value.toLowerCase();
                History.currentPage = 1;
                History.renderPackageList();
            }, 300));
        }

        this.renderPackageList();
    },

    setTab: function(tab) {
        this.currentTab = tab;
        this.currentPage = 1;
        this.render();
    },

    setQuickRange: function(range) {
        const now = new Date();
        if (range === 'all') {
            this.dateFrom = '';
            this.dateTo = '';
        } else if (range === 'week') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            this.dateFrom = d.toISOString().split('T')[0];
            this.dateTo = now.toISOString().split('T')[0];
        } else if (range === 'month') {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            this.dateFrom = d.toISOString().split('T')[0];
            this.dateTo = now.toISOString().split('T')[0];
        }
        this.currentPage = 1;
        this.render();
    },

    _getFilteredPackages: function() {
        let packages = window.DB.getAllPackages();

        // Filter by status tab
        if (this.currentTab === 'picked_up') {
            packages = packages.filter(p => p.status === 'picked_up');
        } else if (this.currentTab === 'returned') {
            packages = packages.filter(p => p.status === 'returned');
        }
        // 'all' shows everything (pending, picked_up, returned)

        // Filter by date range (using tanggal_pickup for completed, created_at for pending)
        if (this.dateFrom) {
            const fromDate = new Date(this.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            packages = packages.filter(p => {
                const refDate = p.tanggal_pickup ? new Date(p.tanggal_pickup) : new Date(p.created_at);
                return refDate >= fromDate;
            });
        }
        if (this.dateTo) {
            const toDate = new Date(this.dateTo);
            toDate.setHours(23, 59, 59, 999);
            packages = packages.filter(p => {
                const refDate = p.tanggal_pickup ? new Date(p.tanggal_pickup) : new Date(p.created_at);
                return refDate <= toDate;
            });
        }

        // Filter by search query
        if (this.searchQuery) {
            const q = this.searchQuery;
            packages = packages.filter(p => {
                const namaMatch = p.nama && p.nama.toLowerCase().includes(q);
                const awbMatch = p.nomor_awb && p.nomor_awb.toLowerCase().includes(q);
                const pinMatch = p.pin && p.pin.toLowerCase().includes(q);
                const storeMatch = p.store_id && p.store_id.toLowerCase().includes(q);
                return namaMatch || awbMatch || pinMatch || storeMatch;
            });
        }

        // Sort by most recent first (tanggal_pickup or created_at)
        packages.sort((a, b) => {
            const dateA = a.tanggal_pickup ? new Date(a.tanggal_pickup) : new Date(a.created_at);
            const dateB = b.tanggal_pickup ? new Date(b.tanggal_pickup) : new Date(b.created_at);
            return dateB - dateA;
        });

        return packages;
    },

    renderPackageList: function() {
        const container = document.getElementById('history-package-list');
        if (!container) return;

        const allFiltered = this._getFilteredPackages();
        const totalPages = Math.max(1, Math.ceil(allFiltered.length / this.pageSize));
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        const pageItems = allFiltered.slice(start, start + this.pageSize);

        if (allFiltered.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📭</div>
                    <p style="font-size: 0.9rem;">Tidak ada data histori ditemukan.</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Coba ubah rentang tanggal atau filter pencarian.</p>
                </div>
            `;
            return;
        }

        // Group items by date
        const grouped = {};
        pageItems.forEach(p => {
            const refDate = p.tanggal_pickup ? p.tanggal_pickup : p.created_at;
            const dateKey = refDate ? refDate.split('T')[0] : 'unknown';
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(p);
        });

        const stores = window.DB.getAllStores();
        const storeMap = {};
        stores.forEach(s => storeMap[s.kode_toko] = s);

        let html = '';

        for (const [dateKey, pkgs] of Object.entries(grouped)) {
            const displayDate = dateKey !== 'unknown' 
                ? window.Utils.formatDate(dateKey) 
                : 'Tanggal tidak diketahui';
            
            const isToday = dateKey === new Date().toISOString().split('T')[0];
            const isYesterday = (() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                return dateKey === y.toISOString().split('T')[0];
            })();

            const dateLabel = isToday ? '📅 Hari ini' : isYesterday ? '📅 Kemarin' : '📅 ' + displayDate;

            html += `
                <div class="history-date-group fadeIn" style="margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding: 0.25rem 0;">
                        <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted);">${dateLabel}</span>
                        <span class="badge" style="background-color: var(--color-surface-2); color: var(--color-text-muted); font-size: 0.7rem;">${pkgs.length} paket</span>
                    </div>
            `;

            pkgs.forEach(p => {
                const store = storeMap[p.store_id];
                const storeName = store ? `${store.nama_toko} (${store.kode_toko})` : (p.store_id || 'Toko Tidak Diketahui');
                
                let statusClass, statusText, statusIcon;
                if (p.status === 'picked_up') {
                    statusClass = 'success';
                    statusText = 'Diambil';
                    statusIcon = '✅';
                } else if (p.status === 'returned') {
                    statusClass = 'danger';
                    statusText = 'Retur';
                    statusIcon = '↩️';
                } else {
                    statusClass = 'warning';
                    statusText = 'Pending';
                    statusIcon = '⏳';
                }

                const pickupTime = p.tanggal_pickup ? new Date(p.tanggal_pickup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
                const masukDate = p.tanggal_masuk ? window.Utils.formatDate(p.tanggal_masuk) : '-';

                // Calculate turnaround time (days between masuk and pickup)
                let turnaroundHtml = '';
                if (p.status === 'picked_up' && p.tanggal_masuk && p.tanggal_pickup) {
                    const masuk = new Date(p.tanggal_masuk);
                    const pickup = new Date(p.tanggal_pickup);
                    const diffDays = Math.ceil(Math.abs(pickup - masuk) / (1000 * 60 * 60 * 24));
                    const turnaroundColor = diffDays <= 3 ? 'var(--color-success)' : diffDays <= 5 ? 'var(--color-warning)' : 'var(--color-danger)';
                    turnaroundHtml = `<span style="font-size: 0.7rem; color: ${turnaroundColor}; font-weight: 600;">${diffDays} hari</span>`;
                }

                html += `
                    <div class="card glassmorphism history-item" style="margin-bottom: 0.5rem; cursor: pointer; padding: 0.75rem 1rem; border-left: 3px solid var(--color-${statusClass}); transition: transform 0.15s, box-shadow 0.15s;" 
                        onclick="window.location.hash='#package-detail?id=${p.id}'">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                    <span style="font-size: 0.9rem;">${statusIcon}</span>
                                    <h4 style="font-size: 0.95rem; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.Utils.escapeHtml(p.nama)}</h4>
                                </div>
                                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; margin-top: 0.25rem;">
                                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">🏪 ${window.Utils.escapeHtml(storeName)}</span>
                                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">📦 ${window.Utils.escapeHtml(p.nomor_awb || '-')}</span>
                                </div>
                                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; margin-top: 0.15rem;">
                                    <span style="font-size: 0.7rem; color: var(--color-text-muted);">PIN: <strong style="color: var(--color-text);">${window.Utils.escapeHtml(p.pin)}</strong></span>
                                    <span style="font-size: 0.7rem; color: var(--color-text-muted);">Masuk: ${masukDate}</span>
                                    ${pickupTime ? `<span style="font-size: 0.7rem; color: var(--color-text-muted);">⏰ ${pickupTime}</span>` : ''}
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; flex-shrink: 0; margin-left: 0.5rem;">
                                <span class="badge badge-${statusClass}" style="white-space: nowrap; font-size: 0.7rem;">${statusText}</span>
                                ${turnaroundHtml}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        // Pagination
        if (totalPages > 1) {
            html += `
                <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1rem 0; margin-bottom: 1rem;">
                    <button class="btn" style="width: auto; padding: 0.5rem 1rem; background-color: var(--color-surface-2); color: var(--color-text); font-size: 0.85rem;" 
                        onclick="History.prevPage()" ${this.currentPage <= 1 ? 'disabled style="opacity:0.4; width: auto; padding: 0.5rem 1rem; background-color: var(--color-surface-2); color: var(--color-text); font-size: 0.85rem;"' : ''}>
                        ‹ Prev
                    </button>
                    <span style="font-size: 0.85rem; color: var(--color-text-muted);">
                        ${this.currentPage} / ${totalPages}
                    </span>
                    <button class="btn" style="width: auto; padding: 0.5rem 1rem; background-color: var(--color-surface-2); color: var(--color-text); font-size: 0.85rem;"
                        onclick="History.nextPage()" ${this.currentPage >= totalPages ? 'disabled style="opacity:0.4; width: auto; padding: 0.5rem 1rem; background-color: var(--color-surface-2); color: var(--color-text); font-size: 0.85rem;"' : ''}>
                        Next ›
                    </button>
                </div>
            `;
        }

        // Footer summary
        html += `
            <div style="text-align: center; padding: 0.5rem; color: var(--color-text-muted); font-size: 0.75rem;">
                Menampilkan ${Math.min(start + 1, allFiltered.length)}–${Math.min(start + this.pageSize, allFiltered.length)} dari ${allFiltered.length} paket
            </div>
        `;

        container.innerHTML = html;
    },

    prevPage: function() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPackageList();
            window.scrollTo(0, 0);
        }
    },

    nextPage: function() {
        const allFiltered = this._getFilteredPackages();
        const totalPages = Math.ceil(allFiltered.length / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderPackageList();
            window.scrollTo(0, 0);
        }
    }
};

window.History = History;
