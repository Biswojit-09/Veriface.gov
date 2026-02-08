/**
 * report.js
 * Handles loading shared media/metadata into the Report Misuse panel (p4.html).
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mediaContainer = document.querySelector('.aspect-video'); // Target the video container
    const videoPlaceholder = document.querySelector('.aspect-video video, .aspect-video img'); // Existing content
    const incidentTitle = document.querySelector('input[type="text"]');
    const summaryText = document.querySelector('textarea');

    // Load Data
    loadReportData();

    // Event Listener for Generate Report
    const generateBtn = document.getElementById('generate-report-btn');
    const previewSection = document.getElementById('preview-section');
    const previewContainer = document.getElementById('preview-container');

    if (generateBtn) {
        generateBtn.addEventListener('click', generateReportPreview);
    }

    function loadReportData() {
        if (typeof MediaStore === 'undefined') {
            console.error('MediaStore not loaded');
            return;
        }

        const media = MediaStore.getMedia();
        const metadata = MediaStore.getMetadata();

        if (media.data && mediaContainer) {
            // Clear existing background image/placeholder
            mediaContainer.style.backgroundImage = 'none';
            mediaContainer.innerHTML = ''; // Remove play buttons etc for now to show raw media or custom player

            let mediaElement;
            if (media.type.startsWith('video/')) {
                mediaElement = document.createElement('video');
                mediaElement.src = media.data;
                mediaElement.className = 'w-full h-full object-contain bg-black';
                mediaElement.controls = true;
                mediaElement.autoplay = true;
                mediaElement.loop = true;
                mediaElement.muted = true; // Required for autoplay in most browsers
                mediaElement.playsInline = true;

                // Add simulated detection overlay container
                const overlay = document.createElement('div');
                overlay.className = 'absolute inset-0 pointer-events-none z-10 overflow-hidden';
                mediaContainer.parentElement.style.position = 'relative'; // Ensure parent is relative

                // Simulate a detection box moving around
                const box = document.createElement('div');
                box.className = 'absolute border-2 border-red-500 bg-red-500/20 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300';
                box.style.width = '15%';
                box.style.height = '15%';
                box.style.top = '30%';
                box.style.left = '40%';

                const label = document.createElement('div');
                label.className = 'absolute -top-6 left-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap';
                label.textContent = 'LIP SYNC FAIL';
                box.appendChild(label);

                overlay.appendChild(box);
                mediaContainer.appendChild(overlay);

                // Animate the box purely for visual effect in this prototype
                setInterval(() => {
                    box.style.top = (20 + Math.random() * 40) + '%';
                    box.style.left = (30 + Math.random() * 40) + '%';
                }, 2000);

                // Ensure it plays
                mediaElement.addEventListener('loadedmetadata', () => {
                    mediaElement.play().catch(e => console.warn('Autoplay prevented:', e));
                });

            } else {
                mediaElement = document.createElement('img');
                mediaElement.src = media.data;
                mediaElement.className = 'w-full h-full object-contain bg-black';

                // Static detection for image
                const overlay = document.createElement('div');
                overlay.className = 'absolute inset-0 pointer-events-none z-10';
                mediaContainer.parentElement.style.position = 'relative';

                const box = document.createElement('div');
                box.className = 'absolute border-2 border-red-500 bg-red-500/20 rounded top-1/4 left-1/3 w-1/3 h-1/3 shadow-[0_0_15px_rgba(239,68,68,0.5)]';

                const label = document.createElement('div');
                label.className = 'absolute -top-6 left-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm';
                label.textContent = 'GAN ARTIFACTS';
                box.appendChild(label);

                overlay.appendChild(box);
                mediaContainer.appendChild(overlay);
            }
            mediaContainer.appendChild(mediaElement);
        }

        if (metadata) {
            // Update Incident Title with Filename
            if (incidentTitle) {
                incidentTitle.value = `Unauthorized Usage - ${metadata.name}`;
            }

            // Update Summary with Analysis details
            if (summaryText) {
                const date = new Date(metadata.timestamp).toLocaleDateString();
                summaryText.value = `Analysis of uploaded evidence (${metadata.name}) conducted on ${date}.\n\n` +
                    `System flagged content with Score: ${metadata.score}/100.\n` +
                    `Verdict: ${metadata.verdict}.\n\n` +
                    `Technical metadata indicates potential manipulation consistent with deepfake algorithms. ` +
                    `Source hash: ${metadata.hash}.`;
            }
        }
    }

    function generateReportPreview() {
        if (!previewSection || !previewContainer) return;

        // Gather Data
        const title = incidentTitle ? incidentTitle.value : 'Untitled Incident';
        const summary = summaryText ? summaryText.value : 'No summary provided.';
        const dateInput = document.querySelector('input[type="date"]');
        const platformSelect = document.querySelector('select');

        const date = dateInput ? dateInput.value : new Date().toLocaleDateString();
        const platform = platformSelect ? platformSelect.value : 'Unknown';
        const metadata = MediaStore.getMetadata() || { hash: 'N/A', score: 'N/A' };

        // Activate Section
        previewSection.classList.remove('opacity-40', 'grayscale', 'pointer-events-none');

        // Generate Content
        previewContainer.innerHTML = `
            <div class="w-full text-left space-y-6 animate-fade-in-up">
                <div class="border-b border-gray-200 dark:border-border-dark pb-4 flex justify-between items-start">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-1">Incident Report Preview</h2>
                        <p class="text-sm text-slate-500">Reference: REF-${Math.floor(Math.random() * 10000)} | Generated: ${new Date().toLocaleString()}</p>
                    </div>
                    <div class="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold uppercase tracking-wider">
                        Verified Draft
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div>
                            <h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Incident Title</h5>
                            <p class="text-slate-900 dark:text-white font-medium">${title}</p>
                        </div>
                        <div>
                            <h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date & Source</h5>
                            <p class="text-slate-900 dark:text-white">${date} via ${platform}</p>
                        </div>
                        <div>
                            <h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Forensic Evidence</h5>
                            <p class="font-mono text-xs text-slate-600 dark:text-slate-400 break-all">
                                Hash: ${metadata.hash}<br>
                                Score: ${metadata.score}/100 (${metadata.verdict})
                            </p>
                        </div>
                    </div>
                    <div class="bg-slate-50 dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-border-dark">
                        <h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Executive Summary</h5>
                        <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">${summary}</p>
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-border-dark">
                    <button class="px-4 py-2 rounded-lg border border-gray-300 dark:border-border-dark text-slate-600 dark:text-text-secondary text-sm font-medium hover:bg-slate-50 dark:hover:bg-card-dark transition-colors">
                        Edit Details
                    </button>
                    <button onclick="alert('Report exported to PDF (Simulated)')" class="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">download</span>
                        Export Final PDF
                    </button>
                </div>
            </div>
        `;

        // Scroll into view
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
