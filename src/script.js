const { ipcRenderer } = require('electron');

const form = document.getElementById('scrapForm');
const startBtn = document.getElementById('startBtn');
const status = document.getElementById('status');

function createProgressElements() {
    const existingProgress = document.querySelector('.progress-container');
    if (existingProgress) existingProgress.remove();

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
        <div class="progress-info">
            <div class="progress-stats">
                <span id="progressText">Preparing...</span>
                <span id="progressCount"></span>
            </div>
            <div class="progress-bar">
                <div id="progressFill" class="progress-fill"></div>
            </div>
            <div class="download-stats">
                <span id="downloadedCount">Downloaded: 0</span>
                <span id="skippedCount">Skipped: 0</span>
            </div>
            <div class="progress-controls">
                <button id="cancelBtn" class="cancel-btn">Cancel</button>
            </div>
        </div>
    `;
    
    status.appendChild(progressContainer);
    
    // Cancel button functionality
    const cancelBtn = document.getElementById('cancelBtn');
    cancelBtn.addEventListener('click', async () => {
        cancelBtn.disabled = true;
        cancelBtn.textContent = 'Cancelling...';
        
        try {
            const result = await ipcRenderer.invoke('cancel-scraping');
            if (result.success) {
                document.getElementById('progressText').textContent = 'Cancelling operation...';
            }
        } catch (error) {
            console.error('Error cancelling:', error);
        }
    });
    
    return {
        text: document.getElementById('progressText'),
        count: document.getElementById('progressCount'),
        fill: document.getElementById('progressFill'),
        downloaded: document.getElementById('downloadedCount'),
        skipped: document.getElementById('skippedCount'),
        cancelBtn: cancelBtn
    };
}

// Progress update handler
ipcRenderer.on('scraping-progress', (event, data) => {
    const progressElements = document.querySelector('.progress-container') ? 
        {
            text: document.getElementById('progressText'),
            count: document.getElementById('progressCount'),
            fill: document.getElementById('progressFill'),
            downloaded: document.getElementById('downloadedCount'),
            skipped: document.getElementById('skippedCount')
        } : createProgressElements();

    switch (data.type) {
        case 'searching':
            progressElements.text.textContent = data.message;
            progressElements.count.textContent = '';
            break;

        case 'found':
            progressElements.text.textContent = data.message;
            progressElements.count.textContent = `0/${data.total}`;
            progressElements.fill.style.width = '0%';
            break;

        case 'progress':
            progressElements.text.textContent = data.message;
            progressElements.count.textContent = `${data.current}/${data.total}`;
            const percentage = (data.current / data.total) * 100;
            progressElements.fill.style.width = `${percentage}%`;
            progressElements.downloaded.textContent = `Downloaded: ${data.downloaded}`;
            progressElements.skipped.textContent = `Skipped: ${data.skipped}`;
            break;

        case 'downloaded':
            progressElements.text.textContent = `✅ ${data.filename}`;
            progressElements.count.textContent = `${data.current}/${data.total}`;
            const dlPercentage = (data.current / data.total) * 100;
            progressElements.fill.style.width = `${dlPercentage}%`;
            progressElements.downloaded.textContent = `Downloaded: ${data.downloaded}`;
            progressElements.skipped.textContent = `Skipped: ${data.skipped}`;
            break;

        case 'completed':
            progressElements.text.textContent = data.message;
            progressElements.fill.style.width = '100%';
            if (progressElements.cancelBtn) {
                progressElements.cancelBtn.style.display = 'none';
            }
            break;

        case 'cancelled':
            progressElements.text.textContent = data.message;
            if (progressElements.cancelBtn) {
                progressElements.cancelBtn.style.display = 'none';
            }
            break;

        case 'error':
            progressElements.text.textContent = `❌ ${data.message}`;
            if (progressElements.cancelBtn) {
                progressElements.cancelBtn.style.display = 'none';
            }
            break;
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const searchTerm = document.getElementById('searchTerm').value.trim();
    if (!searchTerm) return;
    
    startBtn.disabled = true;
    startBtn.textContent = 'Processing...';
    status.className = 'status loading';
    status.innerHTML = '<p>🔍 Starting search...</p>';

    createProgressElements();
    
    try {
        const result = await ipcRenderer.invoke('start-scraping', searchTerm);
        
        if (result.success) {
            status.className = 'status success';
        } else {
            status.className = 'status error';
            const progressElements = document.querySelector('.progress-container');
            if (progressElements) {
                document.getElementById('progressText').textContent = `❌ ${result.message}`;
            }
        }
    } catch (error) {
        status.className = 'status error';
        const progressElements = document.querySelector('.progress-container');
        if (progressElements) {
            document.getElementById('progressText').textContent = `❌ ${error.message}`;
        }
    } finally {
        // Hide cancel button and restore start button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
        
        startBtn.disabled = false;
        startBtn.textContent = 'Start Scrapping';
    }
});