// js/app.js

const App = {
    init: function() {
        this.bindEvents();
        if (window.Reminder) window.Reminder.init();
        if (window.SyncEngine) window.SyncEngine.init();
        this.updateSyncIndicator();
        this.navigate(window.location.hash || '#dashboard');
    },

    bindEvents: function() {
        // Bottom Nav click handlers
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                const hash = e.currentTarget.getAttribute('href');
                
                // Update URL hash
                window.location.hash = hash;
                
                this.navigate(hash);
            });
        });

        // Hash change handler for browser back/forward
        window.addEventListener('hashchange', () => {
            this.navigate(window.location.hash);
        });
    },

    navigate: function(hash) {
        // Default to dashboard if no hash
        if (!hash || hash === '#') {
            hash = '#dashboard';
        }

        // Map hash to view ID
        let basePath = hash;
        let queryParams = new URLSearchParams();
        if (hash.includes('?')) {
            const parts = hash.split('?');
            basePath = parts[0];
            queryParams = new URLSearchParams(parts[1]);
        }

        const viewMap = {
            '#dashboard': 'view-dashboard',
            '#add': 'view-add',
            '#trip': 'view-trip',
            '#stats': 'view-stats',
            '#stores': 'view-stores',
            '#package-detail': 'view-package-detail',
            '#pickup': 'view-pickup',
            '#settings': 'view-settings'
        };

        const targetId = viewMap[basePath];
        if (!targetId) return;

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.style.display = 'block';
            // trigger reflow
            void targetView.offsetWidth;
            targetView.classList.add('active', 'fadeIn');
            
            // Route specific logic
            if (basePath === '#dashboard' && window.Dashboard) {
                window.Dashboard.render();
            } else if (basePath === '#stores' && window.Store) {
                window.Store.render();
            } else if (basePath === '#add' && window.Package) {
                window.Package.renderForm(queryParams.get('edit'));
            } else if (basePath === '#package-detail' && window.Package) {
                window.Package.renderDetail(queryParams.get('id'));
            } else if (basePath === '#trip' && window.Trip) {
                window.Trip.render();
            } else if (basePath === '#pickup' && window.Pickup) {
                window.Pickup.render(queryParams.get('trip_id'));
            } else if (basePath === '#stats' && window.Stats) {
                window.Stats.render();
            } else if (basePath === '#settings' && window.Settings) {
                window.Settings.render();
            }
        }

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href === basePath || href === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    updateSyncIndicator: function() {
        var el = document.getElementById('sync-indicator');
        if (!el || !window.SyncEngine) return;
        var status = window.SyncEngine.getSyncStatus();
        el.className = 'sync-badge';
        if (!status.isConfigured || status.mode === 'off') {
            el.className += ' not-configured';
            el.textContent = '☁️';
            el.title = 'Sync: Off';
        } else if (status.isSyncing) {
            el.className += ' syncing';
            el.textContent = '☁️';
            el.title = 'Syncing...';
        } else if (!status.isOnline) {
            el.className += ' offline';
            el.textContent = '☁️';
            el.title = 'Offline';
        } else {
            el.className += ' synced';
            el.textContent = '☁️';
            el.title = 'Synced: ' + (status.lastSync ? new Date(status.lastSync).toLocaleString('id-ID') : 'Ready');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();

    // Sync event listeners
    window.addEventListener('sync-start', () => {
        App.updateSyncIndicator();
    });
    window.addEventListener('sync-complete', (e) => {
        App.updateSyncIndicator();
        if (e.detail && e.detail.success) {
            // Refresh current view if on dashboard
            if (window.location.hash === '#dashboard' && window.Dashboard) {
                window.Dashboard.render();
            }
        }
    });
    window.addEventListener('online', () => {
        App.updateSyncIndicator();
        window.Utils.showToast('🟢 Kembali online', 'success');
    });
    window.addEventListener('offline', () => {
        App.updateSyncIndicator();
        window.Utils.showToast('🔴 Mode offline', 'warning');
    });
});
