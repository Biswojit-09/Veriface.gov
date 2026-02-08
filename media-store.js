/**
 * media-store.js
 * Handles saving and retrieving media and analysis metadata from localStorage.
 * Used to share state between p1.html (Analysis), p2.html (Verification), and p4.html (Report).
 */

const MediaStore = {
    saveMedia: function (file, score, verdict) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const base64Data = e.target.result;
                    const metadata = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        timestamp: new Date().toISOString(),
                        score: score,
                        verdict: verdict,
                        // Simulate device/session IDs
                        deviceId: 'D7-' + Math.random().toString(36).substr(2, 2).toUpperCase() + '-' + Math.random().toString(36).substr(2, 2).toUpperCase() + '-X' + Math.floor(Math.random() * 9),
                        fingerprintId: 'DIF-' + Math.floor(1000 + Math.random() * 9000) + '-V' + Math.floor(Math.random() * 5),
                        hash: 'e3b0c442' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')
                    };

                    // Save Metadata
                    localStorage.setItem('veriface_metadata', JSON.stringify(metadata));

                    // Save Media (Warning: LocalStorage has strict limits ~5MB. Large videos will fail)
                    // We will try/catch this specifically.
                    try {
                        localStorage.setItem('veriface_media_data', base64Data);
                        localStorage.setItem('veriface_media_type', file.type);
                        console.log('Media saved successfully to localStorage');
                    } catch (err) {
                        console.warn('Media too large for localStorage, saving only metadata.', err);
                        localStorage.removeItem('veriface_media_data'); // Clear if partial write
                        localStorage.setItem('veriface_media_error', 'File too large for prototype storage');
                    }

                    resolve(metadata);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    getMetadata: function () {
        try {
            return JSON.parse(localStorage.getItem('veriface_metadata'));
        } catch (e) {
            return null;
        }
    },

    getMedia: function () {
        return {
            data: localStorage.getItem('veriface_media_data'),
            type: localStorage.getItem('veriface_media_type'),
            error: localStorage.getItem('veriface_media_error')
        };
    }
};
