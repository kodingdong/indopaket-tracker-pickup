// js/app.js

const App = {
    init: function() {
        this.bindEvents();
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
        const viewMap = {
            '#dashboard': 'view-dashboard',
            '#add': 'view-add',
            '#trip': 'view-trip',
            '#stats': 'view-stats',
            '#stores': 'view-stores'
        };

        const targetId = viewMap[hash];
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
            if (hash === '#stores' && window.Store) {
                window.Store.render();
            }
        }

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('href') === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
