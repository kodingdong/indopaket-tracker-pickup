// js/barcode.js

const Barcode = {
    scanner: null,

    generateBarcode: function(awbNumber, canvasElementId) {
        if (!awbNumber || typeof JsBarcode === 'undefined') return;
        try {
            JsBarcode("#" + canvasElementId, awbNumber, {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true
            });
        } catch (e) {
            console.error("Gagal generate barcode", e);
        }
    },

    startScanner: function(containerId, onScanSuccess) {
        if (typeof Html5Qrcode === 'undefined') {
            console.error("Html5Qrcode script not loaded");
            window.Utils.showToast("Library Scanner belum siap", "warning");
            return;
        }

        this.scanner = new Html5Qrcode(containerId);
        
        const config = { fps: 10, qrbox: { width: 250, height: 100 } };
        
        this.scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
                this.playBeep();
                if (navigator.vibrate) {
                    navigator.vibrate(200);
                }
                
                if (typeof onScanSuccess === 'function') {
                    onScanSuccess(decodedText);
                }
            },
            (errorMessage) => {
                // Ignore parse errors (they happen repeatedly while scanning)
            }
        ).catch((err) => {
            console.error("Error starting scanner", err);
            window.Utils.showToast("Gagal membuka kamera scanner", "danger");
        });
    },

    stopScanner: function() {
        if (this.scanner) {
            this.scanner.stop().then(() => {
                this.scanner.clear();
                this.scanner = null;
            }).catch(err => {
                console.error("Failed to stop scanner", err);
            });
        }
    },

    playBeep: function() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 800; // 800Hz
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 200);
        } catch (e) {
            console.error("Audio API not supported", e);
        }
    }
};

window.Barcode = Barcode;
