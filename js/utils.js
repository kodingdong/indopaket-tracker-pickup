// js/utils.js

const Utils = {
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },
    
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    },
    
    daysUntilDeadline: function(deadlineDate) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const target = new Date(deadlineDate);
        target.setHours(0,0,0,0);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    getDeadlineStatus: function(daysRemaining) {
        if (daysRemaining < 0) return 'terlambat';
        if (daysRemaining === 0) return 'hari-ini';
        if (daysRemaining <= 1) return 'besok';
        if (daysRemaining <= 3) return 'segera';
        return 'aman';
    },
    
    calculateDeadline: function(arrivalDateStr, maxDays = 5) {
        const date = new Date(arrivalDateStr);
        date.setDate(date.getDate() + maxDays);
        return date.toISOString().split('T')[0];
    },
    
    showToast: function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast slideUp toast-${type}`;
        toast.innerText = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    showConfirm: function(options) {
        var overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        
        var btnClass = options.type === 'danger' ? 'confirm-btn-danger' : 'confirm-btn-ok';
        
        overlay.innerHTML = 
            '<div class="confirm-dialog">' +
                '<div class="confirm-dialog-title">' + (options.title || 'Konfirmasi') + '</div>' +
                '<div class="confirm-dialog-message">' + (options.message || 'Apakah Anda yakin?') + '</div>' +
                '<div class="confirm-dialog-actions">' +
                    '<button class="confirm-btn-cancel" id="confirm-cancel-btn">' + (options.cancelText || 'Batal') + '</button>' +
                    '<button class="' + btnClass + '" id="confirm-ok-btn">' + (options.confirmText || 'OK') + '</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(overlay);
        
        overlay.querySelector('#confirm-ok-btn').addEventListener('click', function() {
            overlay.remove();
            if (options.onConfirm) options.onConfirm();
        });
        
        overlay.querySelector('#confirm-cancel-btn').addEventListener('click', function() {
            overlay.remove();
            if (options.onCancel) options.onCancel();
        });
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.remove();
                if (options.onCancel) options.onCancel();
            }
        });
    }
};

window.Utils = Utils;
