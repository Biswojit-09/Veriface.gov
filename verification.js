/**
 * verification.js
 * Handles dynamic updates for the Verification Panel (p2.html).
 * Loads metadata from MediaStore matches the analysis result.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Metadata
    const hashDisplay = document.getElementById('hash-display');
    const timestampDisplay = document.getElementById('timestamp-display');
    const deviceIdDisplay = document.getElementById('device-id-display');
    const fingerprintIdDisplay = document.getElementById('fingerprint-id-display');

    // DOM Elements - Actions
    const downloadBtn = document.getElementById('download-cert-btn');
    const shareBtn = document.getElementById('share-proof-btn');

    // DOM Elements - Monitoring
    const monitoringStatus = document.getElementById('monitoring-status');
    const monitoringList = document.getElementById('monitoring-list'); // If we add a list later

    // Load Metadata
    loadVerificationData();

    // Setup Actions
    if (downloadBtn) {
        downloadBtn.addEventListener('click', generateCertificate);
    }
    if (shareBtn) {
        shareBtn.addEventListener('click', shareProof);
    }

    // Simulate Live Monitoring
    startLiveMonitoring();

    function loadVerificationData() {
        if (typeof MediaStore === 'undefined') {
            console.error('MediaStore not loaded');
            return;
        }

        const metadata = MediaStore.getMetadata();
        if (!metadata) {
            console.warn('No verification metadata found. Using default placeholders.');
            return;
        }

        // Update DOM
        if (hashDisplay) hashDisplay.textContent = metadata.hash;

        if (timestampDisplay) {
            const date = new Date(metadata.timestamp);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour12: false }) + ' UTC';
            timestampDisplay.innerHTML = `${dateStr}<br/>${timeStr}`;
        }

        if (deviceIdDisplay) {
            deviceIdDisplay.innerHTML = `${metadata.deviceId}<br/>Session: Active`;
        }

        if (fingerprintIdDisplay) {
            fingerprintIdDisplay.innerHTML = `${metadata.fingerprintId}<br/>SECURE_V2`;
        }
    }

    function generateCertificate() {
        // Create a basic certificate text file for prototype
        const metadata = MediaStore.getMetadata() || {
            name: 'Unknown',
            hash: 'N/A',
            timestamp: new Date().toISOString()
        };

        const certContent = `
VERIFACE DIGITAL IDENTITY CERTIFICATE
=====================================

File Name: ${metadata.name}
Digital Fingerprint (Hash): ${metadata.hash}
Timestamp: ${metadata.timestamp}
Device ID: ${metadata.deviceId || 'N/A'}
Verification ID: ${metadata.fingerprintId || 'N/A'}

Status: IMMUTABLE & ANCHORED
Blockchain Node: SYNCED (Block #882910)

-------------------------------------
This document certifies that the digital asset identified above has been 
processed by the Veriface Immutable Ledger System.
        `;

        const blob = new Blob([certContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Veriface_Certificate_${metadata.fingerprintId || 'Draft'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Visual feedback
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Downloaded';
        setTimeout(() => {
            downloadBtn.innerHTML = originalText;
        }, 2000);
    }

    function shareProof() {
        const metadata = MediaStore.getMetadata();
        const hash = metadata ? metadata.hash : 'e3b0c442...';
        const shareUrl = `https://veriface.security/verify/${hash}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            alert(`Proof Link Copied to Clipboard:\n${shareUrl}`);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy link. Please manually copy the URL.');
        });
    }

    function startLiveMonitoring() {
        if (!monitoringStatus) return;

        const messages = [
            "Scanning global nodes...",
            "Checking for active clones...",
            "Verifying integrity signatures...",
            "Monitoring dark web repositories...",
            "Syncing with ledger..."
        ];

        // Ensure the blinking dot is there
        const dot = monitoringStatus.querySelector('.bg-green-500');
        const ping = monitoringStatus.querySelector('.animate-ping');

        setInterval(() => {
            // Pulse effect intensity randomizer
            if (ping) {
                ping.style.opacity = (Math.random() * 0.5 + 0.5).toString();
            }
        }, 1000);
    }
});
