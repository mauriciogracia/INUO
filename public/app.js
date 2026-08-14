document.addEventListener('DOMContentLoaded', () => {
  const logViewport = document.getElementById('log-viewport');
  const commandForm = document.getElementById('command-form');
  const commandInput = document.getElementById('command-input');
  const langSelect = document.getElementById('lang-select');

  const systemVersionEl = document.getElementById('system-version');
  const statusModeEl = document.getElementById('status-mode');
  const statusSuccinctEl = document.getElementById('status-succinct');
  const statusDebugEl = document.getElementById('status-debug');

  // 1. Fetch System Status
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        systemVersionEl.textContent = `v${data.version}`;
        statusModeEl.textContent = data.mode;
        langSelect.value = data.lang;
        statusSuccinctEl.textContent = data.succinct ? 'ON' : 'OFF';
        statusDebugEl.textContent = `Level ${data.debugLevel}`;
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  }

  fetchStatus();

  // 2. Setup Server-Sent Events (SSE) Live Log Stream
  const eventSource = new EventSource('/api/stream');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      appendLog(data.channel, data.content);
    } catch (err) {
      console.error('SSE parse error:', err);
    }
  };

  eventSource.onerror = () => {
    console.warn('SSE connection error. Retrying...');
  };

  // 3. Append Log Entry to Viewport
  function appendLog(channel, content) {
    if (!content) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    // Channel styling
    if (channel === 'THINKING' || content.includes('🧠')) {
      entry.classList.add('thinking-msg');
    } else if (channel === 'DEBUG' || content.includes('⚙')) {
      entry.classList.add('debug-msg');
    } else if (content.startsWith('inuo >')) {
      entry.classList.add('user-cmd');
    } else {
      entry.classList.add('reply-msg');
    }

    // Strip raw ANSI escape sequences for web rendering
    const cleanText = content.replace(/\x1b\[[0-9;]*m/g, '');
    entry.textContent = cleanText;

    logViewport.appendChild(entry);
    logViewport.scrollTop = logViewport.scrollHeight;
  }

  // 4. Handle Command Form Submission
  commandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const command = commandInput.value.trim();
    if (!command) return;

    commandInput.value = '';

    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
    } catch (err) {
      appendLog('DEBUG', `[Network Error] Failed to send command: ${err.message}`);
    }
  });

  // 5. Language Selector Change
  langSelect.addEventListener('change', async () => {
    const selectedLang = langSelect.value;
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `mode lang ${selectedLang}` }),
      });
      fetchStatus();
    } catch (err) {
      console.error('Language update error:', err);
    }
  });
});
