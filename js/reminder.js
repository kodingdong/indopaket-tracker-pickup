// js/reminder.js

const Reminder = {
    init: function() {
        if ('Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
        
        // Initial check
        this.checkDeadlines();
        
        // Set interval for every 1 hour (3600000 ms)
        setInterval(() => {
            this.checkDeadlines();
        }, 3600000);
    },

    checkDeadlines: function() {
        if (!window.DB) return;
        
        const pending = window.DB.getPackagesByStatus('pending');
        let notifiedHistory = {};
        try {
            notifiedHistory = JSON.parse(localStorage.getItem('indopaket_notified_history') || '{}');
        } catch (e) {}

        const todayDateStr = new Date().toISOString().split('T')[0];
        let stateChanged = false;

        pending.forEach(pkg => {
            const days = window.Utils.daysUntilDeadline(pkg.deadline);
            const historyKey = `${pkg.id}_${todayDateStr}`;

            // Expired -> auto mark returned (H-0 in the issue means expired, but days < 0 is mathematically expired)
            if (days < 0) {
                window.DB.markAsReturned(pkg.id);
                stateChanged = true;
                if (!notifiedHistory[historyKey + '_returned']) {
                    this.sendNotification(
                        'Paket Kadaluarsa (Retur Otomatis)', 
                        `Paket ${pkg.nama} (AWB: ${pkg.nomor_awb || '-'}) telah melewati batas waktu dan ditandai retur.`
                    );
                    notifiedHistory[historyKey + '_returned'] = true;
                }
            } else if (days === 0 || days === 1) { // H-0 (hari ini) atau H-1 (besok) - urgent
                if (!notifiedHistory[historyKey + '_urgent']) {
                    this.sendNotification(
                        '🚨 URGENT: Ambil Paket Segera', 
                        `Paket ${pkg.nama} harus diambil ${days === 0 ? 'HARI INI' : 'BESOK'}! PIN: ${pkg.pin}`
                    );
                    notifiedHistory[historyKey + '_urgent'] = true;
                }
            } else if (days === 2 || days === 3) { // H-2 atau H-3 - warning
                if (!notifiedHistory[historyKey + '_warning']) {
                    this.sendNotification(
                        '⚠️ Peringatan Deadline Paket', 
                        `Paket ${pkg.nama} mendekati deadline (sisa ${days} hari). Jangan lupa diambil.`
                    );
                    notifiedHistory[historyKey + '_warning'] = true;
                }
            }
        });

        localStorage.setItem('indopaket_notified_history', JSON.stringify(notifiedHistory));
        
        // Refresh dashboard if we are on it and state changed
        if (stateChanged && window.location.hash === '#dashboard' && window.Dashboard) {
            window.Dashboard.render();
        }
    },

    sendNotification: function(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'favicon.ico' // optional fallback
            });
        } else {
            // Fallback to toast
            window.Utils.showToast(`${title}: ${body}`, title.includes('URGENT') || title.includes('Kadaluarsa') ? 'danger' : 'warning');
        }
    },

    getDailySummary: function() {
        if (!window.DB) return '';
        const urgentPackages = window.DB.getUrgentPackages();
        const pending = window.DB.getPackagesByStatus('pending');
        
        let returnedToday = 0;
        const pkgs = window.DB.getAllPackages();
        const todayStr = new Date().toISOString().split('T')[0];
        pkgs.forEach(p => {
            if (p.status === 'returned' && p.updated_at && p.updated_at.startsWith(todayStr)) {
                returnedToday++;
            }
        });

        if (urgentPackages.length === 0 && returnedToday === 0) {
            return `Hari ini aman! Ada ${pending.length} paket pending tapi tidak ada yang urgent.`;
        }
        
        let summaryText = ``;
        if (urgentPackages.length > 0) {
            summaryText += `Ada ${urgentPackages.length} paket yang harus segera diambil (<= 1 hari). `;
        }
        if (returnedToday > 0) {
            summaryText += `Terdapat ${returnedToday} paket yang diretur otomatis hari ini.`;
        }
        
        return summaryText.trim();
    }
};

window.Reminder = Reminder;
