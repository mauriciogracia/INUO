import { TOOL_PROMPT } from "./brand.js";
import { getStrings, WebUiStrings } from "./i18n.js";

document.addEventListener("DOMContentLoaded", () => {
  const logViewport = document.getElementById("log-viewport") as HTMLDivElement;
  const commandForm = document.getElementById(
    "command-form",
  ) as HTMLFormElement;
  const commandInput = document.getElementById(
    "command-input",
  ) as HTMLInputElement;
  const systemVersionEl = document.getElementById(
    "system-version",
  ) as HTMLElement;
  const modeSelect = document.getElementById(
    "mode-select",
  ) as HTMLSelectElement;
  const statusSuccinctEl = document.getElementById(
    "status-succinct",
  ) as HTMLElement;
  const statusDebugEl = document.getElementById("status-debug") as HTMLElement;
  const statusAiEl = document.getElementById("status-ai") as HTMLElement;
  const labelAiEl = document.getElementById("label-ai") as HTMLElement;
  const badgeThinking = document.getElementById(
    "badge-thinking",
  ) as HTMLElement;
  const badgeDebug = document.getElementById("badge-debug") as HTMLElement;
  const tabBtns = document.querySelectorAll<HTMLButtonElement>(".tab-btn");
  const labelMode = document.getElementById("label-mode") as HTMLElement;
  const labelSuccinct = document.getElementById(
    "label-succinct",
  ) as HTMLElement;
  const labelDebugEl = document.getElementById("label-debug") as HTMLElement;
  const tabMainEl = document.getElementById("tab-main") as HTMLElement;
  const tabThinkingEl = document.getElementById("tab-thinking") as HTMLElement;
  const tabDebugEl = document.getElementById("tab-debug") as HTMLElement;
  const sendBtnText = document.getElementById("send-btn-text") as HTMLElement;
  const systemConnectedMsg = document.getElementById(
    "system-connected-msg",
  ) as HTMLElement;

  interface StatusResponse {
    version: string;
    mode: string;
    lang: string;
    succinct: boolean;
    debugLevel: number;
    aiUsage?: { requestCount: number; totalTokens: number };
  }

  interface SsePayload {
    channel: string;
    content: string;
    serverStartTime?: string;
  }

  let activeTab = "conversation";
  let thinkingCount = 0;
  let debugCount = 0;
  let knownServerStartTime: string | null = null;
  let uiStrings: WebUiStrings = getStrings("es");
  let thinkingIndicator: HTMLElement | null = null;

  // 1. Tab Switching Handler
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset["tab"] ?? "conversation";
      filterLogs();
    });
  });

  function filterLogs(): void {
    const entries = logViewport.querySelectorAll<HTMLElement>(".log-entry");
    entries.forEach((entry) => {
      if (activeTab === "conversation") {
        entry.style.display =
          entry.classList.contains("thinking-msg") ||
          entry.classList.contains("debug-msg")
            ? "none"
            : "block";
      } else if (activeTab === "thinking") {
        entry.style.display = entry.classList.contains("thinking-msg")
          ? "block"
          : "none";
      } else if (activeTab === "debug") {
        entry.style.display = entry.classList.contains("debug-msg")
          ? "block"
          : "none";
      }
    });
    logViewport.scrollTop = logViewport.scrollHeight;
  }

  function applyTranslations(lang: string): void {
    uiStrings = getStrings(lang);
    tabMainEl.textContent = uiStrings.tabMain;
    tabThinkingEl.textContent = uiStrings.tabThinking;
    tabDebugEl.textContent = uiStrings.tabDebug;
    labelMode.textContent = uiStrings.pillMode;
    labelSuccinct.textContent = uiStrings.pillSuccinct;
    labelDebugEl.textContent = uiStrings.pillDebug;
    labelAiEl.textContent = uiStrings.pillAi;
    sendBtnText.textContent = uiStrings.send;
    commandInput.placeholder = uiStrings.placeholder;
    systemConnectedMsg.textContent = uiStrings.connected;
    Array.from(modeSelect.options).forEach((opt) => {
      opt.text = uiStrings.modeNames[opt.value] ?? opt.value;
    });
  }

  // 2. Fetch System Status
  async function fetchStatus(): Promise<void> {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = (await res.json()) as StatusResponse;
        systemVersionEl.textContent = `v${data.version}`;
        modeSelect.value = data.mode;
        applyTranslations(data.lang);
        statusSuccinctEl.textContent = data.succinct ? "ON" : "OFF";
        statusDebugEl.textContent = `Level ${data.debugLevel}`;
        if (data.aiUsage) {
          const t = data.aiUsage.totalTokens;
          const label =
            t >= 1_000_000
              ? `${(t / 1_000_000).toFixed(1)}M tk`
              : t >= 1_000
                ? `${(t / 1_000).toFixed(1)}k tk`
                : t > 0
                  ? `${t} tk`
                  : `${data.aiUsage.requestCount} req`;
          statusAiEl.textContent = label;
        }
      }
    } catch (err) {
      console.error("Status fetch error:", err);
    }
  }

  fetchStatus();

  // 3. Setup Server-Sent Events (SSE) Live Log Stream
  const eventSource = new EventSource("/api/stream");

  eventSource.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string) as SsePayload;
      if (data.channel === "SERVER_HELLO") {
        if (
          knownServerStartTime !== null &&
          knownServerStartTime !== data.serverStartTime
        ) {
          window.location.reload();
        }
        knownServerStartTime = data.serverStartTime ?? null;
        return;
      }
      appendLog(data.channel, data.content);
    } catch (err) {
      console.error("SSE parse error:", err);
    }
  };

  eventSource.onerror = () => {
    console.warn("SSE connection error. Retrying...");
  };

  // 4. Append Log Entry to Viewport
  function appendLog(channel: string, content: string): void {
    if (!content) return;

    const entry = document.createElement("div");
    entry.className = "log-entry";

    let entryType = "reply";
    if (channel === "THINKING" || content.includes("🧠")) {
      entry.classList.add("thinking-msg");
      entryType = "thinking";
      thinkingCount++;
      badgeThinking.textContent = String(thinkingCount);
      if (!thinkingIndicator) {
        thinkingIndicator = document.createElement("div");
        thinkingIndicator.className =
          "log-entry thinking-msg thinking-indicator";
        if (activeTab !== "thinking") thinkingIndicator.style.display = "none";
        thinkingIndicator.innerHTML =
          `<span class="thinking-label">${uiStrings.thinking}` +
          `<span class="thinking-dots"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span></span>` +
          ` <span class="thinking-hint">${uiStrings.thinkingHint} <em>${uiStrings.tabThinking}</em></span>`;
        logViewport.appendChild(thinkingIndicator);
        logViewport.scrollTop = logViewport.scrollHeight;
      }
    } else if (channel === "DEBUG" || content.includes("⚙")) {
      entry.classList.add("debug-msg");
      entryType = "debug";
      debugCount++;
      badgeDebug.textContent = String(debugCount);
    } else if (content.startsWith(TOOL_PROMPT)) {
      entry.classList.add("user-cmd");
      if (thinkingIndicator) {
        thinkingIndicator.remove();
        thinkingIndicator = null;
      }
    } else {
      entry.classList.add("reply-msg");
      if (thinkingIndicator) {
        thinkingIndicator.remove();
        thinkingIndicator = null;
      }
    }

    if (activeTab === "conversation" && entryType !== "reply") {
      entry.style.display = "none";
    } else if (activeTab === "thinking" && entryType !== "thinking") {
      entry.style.display = "none";
    } else if (activeTab === "debug" && entryType !== "debug") {
      entry.style.display = "none";
    }

    // strip ANSI escape sequences for web rendering
    const cleanText = content.replace(/\x1b\[[0-9;]*m/g, "");
    entry.textContent = cleanText;

    logViewport.appendChild(entry);
    logViewport.scrollTop = logViewport.scrollHeight;
  }

  function appendErrorWithRetry(
    friendlyMessage: string,
    command: string,
  ): void {
    const entry = document.createElement("div");
    entry.className = "log-entry error-msg";
    if (activeTab !== "conversation") entry.style.display = "none";
    const safeCmd = command
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    entry.innerHTML =
      `<span class="error-icon">⚠️</span> <span class="error-text">${friendlyMessage}</span>` +
      ` <button class="retry-btn" data-command="${safeCmd}">${uiStrings.retryBtn}</button>`;
    logViewport.appendChild(entry);
    logViewport.scrollTop = logViewport.scrollHeight;
  }

  async function sendCommand(command: string): Promise<void> {
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      if (!res.ok) {
        const body = await res
          .json()
          .catch(() => ({ error: "Unknown server error" }));
        appendLog(
          "DEBUG",
          `[Command Error] HTTP ${res.status} — ${(body as { error?: string }).error ?? "Unknown"}`,
        );
        appendErrorWithRetry(uiStrings.errorServer, command);
      }
    } catch (err) {
      appendLog(
        "DEBUG",
        `[Network Error] Couldn't reach iNoU: ${(err as Error).message}`,
      );
      appendErrorWithRetry(uiStrings.errorNetwork, command);
    }
  }

  // Retry button click — removes the error entry and re-sends the same command
  logViewport.addEventListener("click", (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest(
      ".retry-btn",
    ) as HTMLButtonElement | null;
    if (!btn) return;
    const command = btn.dataset["command"] ?? "";
    if (command) {
      btn.closest(".error-msg")?.remove();
      void sendCommand(command);
    }
  });

  // 5. Handle Command Form Submission
  commandForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const command = commandInput.value.trim();
    if (!command) return;
    commandInput.value = "";
    await sendCommand(command);
  });

  // 6. Mode Selector Change
  modeSelect.addEventListener("change", async () => {
    const selectedMode = modeSelect.value;
    try {
      await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: `mode ${selectedMode}` }),
      });
      await fetchStatus();
    } catch (err) {
      console.error("Mode update error:", err);
    }
  });
});
