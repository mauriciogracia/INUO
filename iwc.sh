#!/usr/bin/env bash
# iwc.sh – Web Client Launcher
# Opens the INUO web UI in Google Chrome or the system default browser.
# Supports Windows (Git Bash/MSYS/Cygwin), WSL (WSL1/WSL2), macOS, and Linux.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
INUO_PORT="${INUO_PORT:-3000}"
INUO_URL="${INUO_URL:-http://localhost:${INUO_PORT}}"

echo "========================================"
echo " INUO Web Client Launcher"
echo " Target URL: $INUO_URL"
echo "========================================"

# Detect environment
IS_WSL=false
if grep -qi microsoft /proc/version 2>/dev/null || uname -r | grep -qi microsoft 2>/dev/null; then
  IS_WSL=true
fi

OS_NAME="$(uname -s 2>/dev/null || echo 'Unknown')"
echo "[*] Detected Environment: $OS_NAME $( [ "$IS_WSL" = true ] && echo '(WSL)' )"

# Helper to find node binary (handles node / node.exe across WSL, Windows, Linux)
find_node() {
  for n in node node.exe /mnt/c/Program\ Files/nodejs/node.exe /c/Program\ Files/nodejs/node.exe; do
    if command -v "$n" >/dev/null 2>&1; then
      command -v "$n"
      return 0
    fi
  done
  return 1
}

NODE_BIN="$(find_node)"

# Helper to check if server is responsive
is_server_running() {
  if command -v curl >/dev/null 2>&1; then
    curl -s -m 1 "$INUO_URL/api/status" >/dev/null 2>&1 && return 0
  fi
  if [ -n "$NODE_BIN" ]; then
    (cd "$DIR" && "$NODE_BIN" -e "const http=require('http'); http.get('$INUO_URL/api/status', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1));" >/dev/null 2>&1) && return 0
  fi
  return 1
}

# Auto-start INUO Web Server if not already active
if ! is_server_running; then
  echo "[*] INUO Web Server is not running. Starting web server on port ${INUO_PORT}..."
  
  if [ "$IS_WSL" = true ] && command -v powershell.exe >/dev/null 2>&1; then
    win_dir="$(wslpath -w "$DIR" 2>/dev/null || echo "$DIR")"
    powershell.exe -NoProfile -Command "Start-Process -FilePath 'node.exe' -ArgumentList 'bin/inuo.js web $INUO_PORT' -WorkingDirectory '$win_dir' -WindowStyle Hidden" >/dev/null 2>&1 || true
  elif [ "$IS_WSL" = true ] && command -v cmd.exe >/dev/null 2>&1; then
    (cd "$DIR" && cmd.exe /c start /b node bin\\inuo.js web "${INUO_PORT}" >/dev/null 2>&1) || true
  elif [ -n "$NODE_BIN" ]; then
    (cd "$DIR" && nohup "$NODE_BIN" bin/inuo.js web "${INUO_PORT}" > .inuo-web.log 2>&1 &)
  fi

  # Wait for server to become responsive (up to 5 seconds)
  for i in {1..10}; do
    if is_server_running; then
      echo "[✓] Web server started and responding at $INUO_URL"
      break
    fi
    sleep 0.5
  done
  if ! is_server_running; then
    echo "[!] Warning: web server did not respond in time. The browser may show an error page." >&2
  fi
else
  echo "[✓] Connected to existing INUO Web Server on port ${INUO_PORT}"
fi

find_chrome() {
  # 1. Native CLI command lookup
  for cmd in google-chrome google-chrome-stable chromium chromium-browser chrome; do
    if command -v "$cmd" >/dev/null 2>&1; then
      command -v "$cmd"
      return 0
    fi
  done

  # 2. Linux standard locations
  for path in \
    "/usr/bin/google-chrome" \
    "/usr/bin/google-chrome-stable" \
    "/opt/google/chrome/google-chrome" \
    "/snap/bin/chromium" \
    "/usr/bin/chromium-browser"; do
    if [ -x "$path" ]; then
      echo "$path"
      return 0
    fi
  done

  # 3. macOS standard locations
  if [ -d "/Applications/Google Chrome.app" ]; then
    echo "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    return 0
  fi

  # 4. Windows / Git Bash / MSYS paths (/c/...)
  for win_path in \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "/c/Users/${USER:-${USERNAME}}/AppData/Local/Google/Chrome/Application/chrome.exe"; do
    if [ -x "$win_path" ]; then
      echo "$win_path"
      return 0
    fi
  done

  # 5. WSL paths (/mnt/c/...)
  if [ "$IS_WSL" = true ]; then
    for wsl_path in \
      "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
      "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
      "/mnt/c/Users/${USER:-${USERNAME}}/AppData/Local/Google/Chrome/Application/chrome.exe"; do
      if [ -f "$wsl_path" ]; then
        echo "$wsl_path"
        return 0
      fi
    done
  fi

  # 6. Windows where.exe lookup (if available)
  if command -v where.exe >/dev/null 2>&1; then
    local found_win
    found_win=$(where.exe chrome.exe 2>/dev/null | head -n1 | tr -d '\r')
    if [ -n "$found_win" ]; then
      if command -v cygpath >/dev/null 2>&1; then
        cygpath -u "$found_win"
      elif command -v wslpath >/dev/null 2>&1; then
        wslpath -u "$found_win"
      else
        echo "$found_win"
      fi
      return 0
    fi
  fi

  return 1
}

launch_url() {
  local target_url="$1"
  local chrome_bin
  chrome_bin="$(find_chrome)"

  # Try Google Chrome first
  if [ -n "$chrome_bin" ]; then
    echo "[+] Found Chrome at: $chrome_bin"
    echo "[+] Launching INUO in Google Chrome..."
    "$chrome_bin" "$target_url" >/dev/null 2>&1 &
    return 0
  fi

  echo "[-] Chrome binary not found directly. Attempting default system browser..."

  # Fallback: WSL openers
  if [ "$IS_WSL" = true ]; then
    if command -v wslview >/dev/null 2>&1; then
      wslview "$target_url" && return 0
    fi
    if command -v powershell.exe >/dev/null 2>&1; then
      powershell.exe -NoProfile -Command "Start-Process '$target_url'" >/dev/null 2>&1 && return 0
    fi
    if command -v cmd.exe >/dev/null 2>&1; then
      cmd.exe /c start "" "$target_url" >/dev/null 2>&1 && return 0
    fi
    if command -v explorer.exe >/dev/null 2>&1; then
      explorer.exe "$target_url" >/dev/null 2>&1 && return 0
    fi
  fi

  # Fallback: macOS opener
  if command -v open >/dev/null 2>&1; then
    open "$target_url" && return 0
  fi

  # Fallback: Windows Git Bash / Cygwin openers
  if command -v start >/dev/null 2>&1; then
    start "$target_url" && return 0
  fi
  if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "" "$target_url" >/dev/null 2>&1 && return 0
  fi
  if command -v explorer.exe >/dev/null 2>&1; then
    explorer.exe "$target_url" >/dev/null 2>&1 && return 0
  fi

  # Fallback: Linux standard openers
  for opener in xdg-open sensible-browser x-www-browser; do
    if command -v "$opener" >/dev/null 2>&1; then
      "$opener" "$target_url" >/dev/null 2>&1 &
      return 0
    fi
  done
  if command -v gio >/dev/null 2>&1; then
    gio open "$target_url" >/dev/null 2>&1 &
    return 0
  fi

  return 1
}

if launch_url "$INUO_URL"; then
  echo "[✓] Browser launched successfully!"
  exit 0
else
  echo "[!] Error: Unable to automatically launch browser." >&2
  echo "[!] Please open the following URL manually in your browser:" >&2
  echo "    $INUO_URL" >&2
  exit 1
fi

