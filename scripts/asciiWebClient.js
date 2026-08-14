const blessed = require('blessed');
const http = require('http');
const path = require('path');
const { startWebServer } = require('../dist/cli/webServer');

const rootDir = path.join(__dirname, '..');
const PORT = 3000;

// 1. Ensure Express Web Server is running
let server = null;
try {
  server = startWebServer({ port: PORT, rootDir });
} catch {
  // Server might already be running on PORT
}

// 2. Create Blessed ASCII Screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'INUO ASCII Web Client',
  cursor: {
    synthetic: true,
    shape: 'line',
    blink: true,
  },
});

// 3. ASCII Header Box
const headerBox = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: '{center}{bold}{cyan-fg}=== INUO ASCII Web Client (v00.02.95) ==={/cyan-fg}{/bold}\n{yellow-fg}http://localhost:3000/api/stream{/yellow-fg}{/center}',
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    border: {
      fg: '#38bdf8',
    },
  },
});

// 4. ASCII Log Viewport Panel (Middle)
const logBox = blessed.log({
  top: 3,
  left: 0,
  width: '100%',
  height: '100%-6',
  label: ' Live Log & SSE Web Stream ',
  scrollable: true,
  scrollbar: {
    ch: ' ',
    style: {
      bg: 'cyan',
    },
  },
  border: {
    type: 'line',
  },
  style: {
    border: {
      fg: '#64748b',
    },
  },
  tags: true,
});

// 5. ASCII Form Input Box (Bottom)
const form = blessed.form({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 3,
  label: ' Command Input ',
  border: {
    type: 'line',
  },
  style: {
    border: {
      fg: '#4ade80',
    },
  },
});

const input = blessed.textbox({
  parent: form,
  top: 0,
  left: 1,
  width: '100%-4',
  height: 1,
  inputOnFocus: true,
  keys: true,
  mouse: true,
  style: {
    fg: 'white',
    focus: {
      fg: 'cyan',
    },
  },
});

screen.append(headerBox);
screen.append(logBox);
screen.append(form);

logBox.log('{yellow-fg}🚀 Connected to INUO Web Server at http://localhost:3000{/yellow-fg}');
logBox.log('{green-fg}Type commands or questions in the input box below and press Enter.{/green-fg}\n');

// 6. Connect SSE Log Stream
function connectSSE() {
  const req = http.get(`http://localhost:${PORT}/api/stream`, (res) => {
    let buffer = '';
    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const raw = line.slice(6);
            const data = JSON.parse(raw);
            const cleanText = (data.content || '').replace(/\x1b\[[0-9;]*m/g, '');

            if (data.channel === 'THINKING' || cleanText.includes('🧠')) {
              logBox.log(`{magenta-fg}${cleanText}{/magenta-fg}`);
            } else if (data.channel === 'DEBUG' || cleanText.includes('⚙')) {
              logBox.log(`{grey-fg}${cleanText}{/grey-fg}`);
            } else if (cleanText.startsWith('inuo >')) {
              logBox.log(`{cyan-fg}${cleanText}{/cyan-fg}`);
            } else {
              logBox.log(`{green-fg}${cleanText}{/green-fg}`);
            }
            screen.render();
          } catch {}
        }
      }
    });

    res.on('end', () => {
      setTimeout(connectSSE, 1000);
    });
  });

  req.on('error', () => {
    setTimeout(connectSSE, 1000);
  });
}

connectSSE();

// 7. Form Submission Handler
input.on('submit', (val) => {
  const command = (val || '').trim();
  input.clearValue();
  input.focus();

  if (command) {
    if (command === 'exit' || command === 'quit' || command === 'q') {
      process.exit(0);
    }

    const reqData = JSON.stringify({ command });
    const postReq = http.request(
      `http://localhost:${PORT}/api/command`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(reqData),
        },
      },
      () => {}
    );
    postReq.write(reqData);
    postReq.end();
  }
  screen.render();
});

// Key bindings for quitting
screen.key(['C-c'], () => {
  process.exit(0);
});

input.focus();
screen.render();
