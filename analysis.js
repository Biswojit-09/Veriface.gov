
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Main
    const dropZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const processingSection = document.getElementById('processing-section');
    const resultsSection = document.getElementById('results-section');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const fileNameDisplay = document.getElementById('file-name-display');
    const uploadPrompt = document.getElementById('upload-prompt');
    const visualPreview = document.getElementById('visual-preview');
    const processingOverlay = document.getElementById('processing-overlay');

    // DOM Elements - Results
    const verdictCard = document.getElementById('verdict-card');
    const verdictTitle = document.getElementById('verdict-title');
    const verdictText = document.getElementById('verdict-text');
    const confidenceScore = document.getElementById('confidence-score');
    const confidenceCircle = document.getElementById('confidence-circle');
    const riskAudioLabel = document.getElementById('risk-audio-label');
    const riskAudioBar = document.getElementById('risk-audio-bar');
    const riskFaceLabel = document.getElementById('risk-face-label');
    const riskFaceBar = document.getElementById('risk-face-bar');

    // DOM Elements - Detection Overlays
    // Note: These might be inside visualPreview, so we might need to find them or re-insert them
    let overlayVerified = document.getElementById('overlay-verified');
    let overlayLipsync = document.getElementById('overlay-lipsync');
    let overlayLighting = document.getElementById('overlay-lighting');
    let overlayPixels = document.getElementById('overlay-pixels');
    const faceOverlayBox = document.getElementById('face-overlay-box'); // Legacy box

    // Store references to overlays in memory to re-append them after clearing visualPreview
    const detectionOverlays = {
        verified: overlayVerified,
        lipsync: overlayLipsync,
        lighting: overlayLighting,
        pixels: overlayPixels
    };

    // Global state for uploaded media URL
    let currentMediaUrl = null;

    // --- Event Listeners ---

    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropZone.classList.add('border-primary', 'bg-slate-100', 'dark:bg-card-dark/50');
        }

        function unhighlight() {
            dropZone.classList.remove('border-primary', 'bg-slate-100', 'dark:bg-card-dark/50');
        }

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }

    // --- Main Logic ---

    function handleFile(file) {
        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'audio/wav', 'audio/mpeg'];
        if (!validTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, PNG, MP4, MOV, or WAV.');
            return;
        }
        if (file.size > 500 * 1024 * 1024) {
            alert('File is too large. Max size is 500MB.');
            return;
        }

        // Clean up previous blob URL if exists
        if (currentMediaUrl) {
            URL.revokeObjectURL(currentMediaUrl);
        }
        currentMediaUrl = URL.createObjectURL(file);

        // UI Reset
        if (uploadPrompt) uploadPrompt.classList.add('hidden');
        if (processingSection) processingSection.classList.remove('hidden');
        if (resultsSection) resultsSection.classList.add('hidden');
        if (fileNameDisplay) fileNameDisplay.textContent = file.name;

        // Render Preview immediately
        renderPreview(file, currentMediaUrl);

        // Start Analysis
        startAnalysis(file);
    }

    function renderPreview(file, url) {
        if (!visualPreview) return;

        // Clear existing background and content
        visualPreview.style.backgroundImage = 'none';

        // Save the processing overlay element before clearing
        const overlay = visualPreview.querySelector('#processing-overlay');

        // Clear all content
        visualPreview.innerHTML = '';

        // Put processing overlay back
        if (overlay) visualPreview.appendChild(overlay);

        // Re-append the detection overlays (which were removed by innerHTML = '')
        // We use the cached references
        Object.values(detectionOverlays).forEach(el => {
            if (el) {
                el.classList.add('hidden'); // Ensure hidden initially
                visualPreview.appendChild(el);
            }
        });
        // Also legacy box if it exists
        if (faceOverlayBox) {
            faceOverlayBox.classList.add('hidden');
            visualPreview.appendChild(faceOverlayBox);
        }


        let mediaElement;

        if (file.type.startsWith('image/')) {
            mediaElement = document.createElement('img');
            mediaElement.src = url;
            mediaElement.className = 'absolute inset-0 w-full h-full object-contain bg-black';
        } else if (file.type.startsWith('video/')) {
            mediaElement = document.createElement('video');
            mediaElement.src = url;
            mediaElement.className = 'absolute inset-0 w-full h-full object-contain bg-black';
            mediaElement.muted = true;
            mediaElement.loop = true;
            mediaElement.autoplay = true;
            mediaElement.playsInline = true;

            // Ensure video plays
            mediaElement.onloadeddata = () => {
                mediaElement.play().catch(e => console.log('Autoplay prevented:', e));
            };
        }

        if (mediaElement) {
            // Insert media element *before* the overlay so overlay sits on top
            visualPreview.insertBefore(mediaElement, visualPreview.firstChild);
        }
    }

    function startAnalysis(file) {
        // Show loader inside preview
        if (processingOverlay) processingOverlay.classList.remove('hidden');
        if (processingOverlay) processingOverlay.classList.add('flex');

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 8;
            if (progress > 100) progress = 100;

            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${Math.round(progress)}%`;

            if (progress === 100) {
                clearInterval(interval);
                setTimeout(() => {
                    finishAnalysis(file);
                }, 800);
            }
        }, 150);
    }

    function finishAnalysis(file) {
        // Calculate Score (0-100) based on Deterministic Hash of filename
        const score = getDeterministicScore(file.name);

        // Determine Verdict for saving
        let verdictType = 'FAKE';
        if (score < 40) verdictType = 'REAL';
        else if (score >= 40 && score <= 60) verdictType = 'UNCERTAIN';

        // Override for testing keywords
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes('real') || lowerName.includes('clean')) verdictType = 'REAL';
        if (lowerName.includes('fake') || lowerName.includes('deepfake')) verdictType = 'FAKE';

        // Save to MediaStore (for p2.html and p4.html)
        if (typeof MediaStore !== 'undefined') {
            MediaStore.saveMedia(file, score, verdictType).then(() => {
                console.log('Analysis data saved to shared storage');
            }).catch(err => console.error('Failed to save analysis data', err));
        }

        // Hide processing UI
        if (processingSection) processingSection.classList.add('hidden');
        if (processingOverlay) processingOverlay.classList.add('hidden');
        if (processingOverlay) processingOverlay.classList.remove('flex');

        // Show Results
        if (resultsSection) resultsSection.classList.remove('hidden');

        // Apply Logic based on Score thresholds
        applyVerdictLogic(score);

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // --- Helper Functions ---

    function getDeterministicScore(inputString) {
        let hash = 0;
        for (let i = 0; i < inputString.length; i++) {
            const char = inputString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        // Normalize to 0-100. Use absolute value.
        return Math.abs(hash) % 100;
    }

    function applyVerdictLogic(score) {
        // Thresholds:
        // < 40: REAL
        // 40 - 60: UNCERTAIN
        // > 60: FAKE

        let verdictType = 'FAKE'; // Default
        if (score < 40) verdictType = 'REAL';
        else if (score >= 40 && score <= 60) verdictType = 'UNCERTAIN';

        // Override if filename contains specific keywords for testing
        const lowerName = fileNameDisplay.textContent.toLowerCase();
        if (lowerName.includes('real') || lowerName.includes('clean') || lowerName.includes('authentic')) verdictType = 'REAL';
        if (lowerName.includes('fake') || lowerName.includes('deepfake')) verdictType = 'FAKE';

        // Reset Overlays
        hideAllOverlays();

        // Update UI Logic
        if (verdictType === 'REAL') {
            setVerdictUI(
                'bg-green-500/10 border-green-500/20', // Card Style
                'text-green-600 dark:text-green-500',   // Title/Text Color
                'AUTHENTIC MEDIA',                      // Title
                'No signs of digital manipulation detected.', // Desc
                'border-green-500',                     // Circle Border
                `${95 + (score % 5)}%`                  // Confidence (High for Real)
            );
            updateRiskBars('Low Risk', 'text-green-500', 'bg-green-500', '5%');

            // Show Verified Overlay
            if (detectionOverlays.verified) detectionOverlays.verified.classList.remove('hidden');

        } else if (verdictType === 'UNCERTAIN') {
            setVerdictUI(
                'bg-yellow-500/10 border-yellow-500/20',
                'text-yellow-600 dark:text-yellow-500',
                'INCONCLUSIVE ANALYSIS',
                'Mixed signals detected. Manual review recommended.',
                'border-yellow-500',
                `${50 + (score % 10)}%`
            );
            updateRiskBars('Medium Risk', 'text-yellow-500', 'bg-yellow-500', '45%');
            // No overlays for uncertain

        } else { // FAKE
            setVerdictUI(
                'bg-red-500/10 border-red-500/20',
                'text-red-600 dark:text-red-500',
                'DEEPFAKE DETECTED',
                'High probability of AI manipulation found.',
                'border-red-500',
                `${85 + (score % 14)}%`
            );
            updateRiskBars('High Risk', 'text-red-500', 'bg-red-500', '92%');

            // Show Random Granular Detection Logic
            // We want to make sure *something* shows up as per user request

            const anomalies = [];
            if (score > 60) anomalies.push('lipsync');
            if (score > 70) anomalies.push('lighting');
            if (score > 80) anomalies.push('pixels');

            // Force at least one anomaly if it's fake
            if (anomalies.length === 0) anomalies.push('lipsync');

            // Show them
            anomalies.forEach(type => {
                if (detectionOverlays[type]) detectionOverlays[type].classList.remove('hidden');
            });
        }
    }

    function setVerdictUI(cardClass, textClass, title, desc, borderClass, confidence) {
        if (verdictCard) verdictCard.className = `rounded-xl p-6 flex items-center justify-between relative overflow-hidden transition-colors duration-500 border ${cardClass}`;
        if (verdictTitle) {
            verdictTitle.className = `text-3xl font-black ${textClass}`;
            verdictTitle.textContent = title;
        }
        if (verdictText) {
            verdictText.className = `text-sm mt-1 opacity-80 ${textClass}`;
            verdictText.textContent = desc;
        }
        if (confidenceCircle) confidenceCircle.className = `size-16 rounded-full border-4 flex items-center justify-center bg-background-light dark:bg-background-dark ${borderClass}`;
        if (confidenceScore) {
            confidenceScore.className = `text-lg font-bold ${textClass}`;
            confidenceScore.textContent = confidence;
        }
    }

    function hideAllOverlays() {
        Object.values(detectionOverlays).forEach(el => {
            if (el) el.classList.add('hidden');
        });
        if (faceOverlayBox) faceOverlayBox.classList.add('hidden');
    }

    function updateRiskBars(label, textClass, bgClass, width) {
        if (riskAudioLabel) {
            riskAudioLabel.textContent = label;
            riskAudioLabel.className = `text-2xl font-bold ${textClass}`;
        }
        if (riskAudioBar) {
            riskAudioBar.className = `h-1.5 rounded-full ${bgClass}`;
            riskAudioBar.style.width = width;
        }
        if (riskFaceLabel) {
            riskFaceLabel.textContent = label;
            riskFaceLabel.className = `text-2xl font-bold ${textClass}`;
        }
        if (riskFaceBar) {
            riskFaceBar.className = `h-1.5 rounded-full ${bgClass}`;
            riskFaceBar.style.width = width;
        }
    }
});
