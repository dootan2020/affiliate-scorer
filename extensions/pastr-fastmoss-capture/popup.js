// Load and display current stats from background service worker
function loadStats() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (stats) => {
    if (!stats) return;

    document.getElementById('buffered').textContent = stats.buffered;
    document.getElementById('total').textContent = stats.totalCaptured.toLocaleString();
    document.getElementById('syncs').textContent = stats.syncCount;
    document.getElementById('lastSync').textContent = stats.lastSyncTime
      ? new Date(stats.lastSyncTime).toLocaleTimeString()
      : '-';

    const cs = stats.crawlState;
    const progressSection = document.getElementById('crawlProgress');
    const startBtn = document.getElementById('startCrawl');
    const stopBtn = document.getElementById('stopCrawl');
    const maxPagesRow = document.getElementById('maxPagesRow');
    const statusEl = document.getElementById('status');

    if (cs.active) {
      // Show crawl progress, hide start controls
      progressSection.classList.remove('hidden');
      startBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      maxPagesRow.classList.add('hidden');

      document.getElementById('crawlPhase').textContent = cs.phase;
      document.getElementById('crawlCat').textContent = `${cs.currentCategoryIndex + 1}/${cs.totalCategories}`;
      document.getElementById('crawlPage').textContent = `${cs.currentPage}/${cs.maxPages}`;
      document.getElementById('crawlCaptured').textContent = cs.captured.toLocaleString();

      // Calculate overall progress percentage
      const totalSteps = cs.totalCategories * cs.maxPages;
      const doneSteps = cs.currentCategoryIndex * cs.maxPages + cs.currentPage;
      const progress = totalSteps > 0 ? (doneSteps / totalSteps) * 100 : 0;
      document.getElementById('progressBar').style.width = `${Math.min(100, progress)}%`;

      statusEl.textContent = 'Auto-crawl in progress...';
      statusEl.className = 'status green';
    } else {
      // Hide crawl progress, show start controls
      progressSection.classList.add('hidden');
      startBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      maxPagesRow.classList.remove('hidden');

      if (cs.phase === 'done') {
        statusEl.textContent = `Crawl complete! ${cs.captured.toLocaleString()} products captured`;
        statusEl.className = 'status green';
      } else if (cs.phase === 'stopped') {
        statusEl.textContent = `Crawl stopped. ${cs.captured.toLocaleString()} products captured`;
        statusEl.className = 'status';
      } else {
        statusEl.textContent = 'Browse FastMoss to capture data passively';
        statusEl.className = 'status';
      }
    }
  });
}

// Load saved config on popup open
chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (config) => {
  if (config && config.pastr_auth_secret) {
    document.getElementById('secret').value = '••••••••';
  }
});

// Save auth secret to extension storage
document.getElementById('saveConfig').addEventListener('click', () => {
  const secret = document.getElementById('secret').value;
  if (secret && secret !== '••••••••') {
    chrome.runtime.sendMessage({
      type: 'SET_CONFIG',
      config: { pastr_auth_secret: secret }
    }, () => {
      document.getElementById('status').textContent = 'Config saved!';
      document.getElementById('status').className = 'status green';
      document.getElementById('secret').value = '••••••••';
    });
  }
});

// Trigger immediate sync of buffered data
document.getElementById('syncNow').addEventListener('click', () => {
  document.getElementById('status').textContent = 'Syncing...';
  document.getElementById('status').className = 'status';
  chrome.runtime.sendMessage({ type: 'FORCE_SYNC' }, () => {
    document.getElementById('status').textContent = 'Sync triggered!';
    document.getElementById('status').className = 'status green';
    setTimeout(loadStats, 1500);
  });
});

// Start auto-crawl with selected options
document.getElementById('startCrawl').addEventListener('click', () => {
  const maxPages = parseInt(document.getElementById('maxPages').value) || 30;
  chrome.runtime.sendMessage({
    type: 'START_CRAWL',
    options: { maxPages, categories: null } // null = use all default categories
  });
  document.getElementById('status').textContent = 'Starting auto-crawl...';
  document.getElementById('status').className = 'status green';
  setTimeout(loadStats, 1000);
});

// Stop auto-crawl and sync buffered data
document.getElementById('stopCrawl').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_CRAWL' });
  document.getElementById('status').textContent = 'Stopping...';
  document.getElementById('status').className = 'status';
  setTimeout(loadStats, 1000);
});

// Initial load + poll every 2s for live updates
loadStats();
setInterval(loadStats, 2000);
