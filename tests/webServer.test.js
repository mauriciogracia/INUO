const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { startWebServer } = require("../dist/cli/webServer");

function requestJson(server, method, requestPath, body) {
  const address = server.address();
  const payload = body ? JSON.stringify(body) : undefined;
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path: requestPath,
        method,
        headers: payload
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            }
          : undefined,
      },
      (response) => {
        let responseBody = "";
        response.on("data", (chunk) => (responseBody += chunk));
        response.on("end", () =>
          resolve({
            statusCode: response.statusCode,
            body: JSON.parse(responseBody),
          }),
        );
        response.on("error", reject);
      },
    );
    request.on("error", reject);
    if (payload) request.write(payload);
    request.end();
  });
}

test("Lightweight HTTP Web Server Unit Tests", async (t) => {
  const testPort = 3099;
  const server = startWebServer({
    port: testPort,
    rootDir: path.join(__dirname, ".."),
  });

  // Cleanup server after tests
  t.after(() => {
    server.close();
  });

  await t.test("serves status JSON at GET /api/status", async () => {
    const data = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/api/status`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(JSON.parse(body)));
        res.on("error", reject);
      });
    });

    assert.equal(typeof data.version, "string");
    assert.equal(typeof data.mode, "string");
    assert.equal(typeof data.lang, "string");
    assert.equal(typeof data.succinct, "boolean");
  });

  await t.test("serves static HTML index at GET /", async () => {
    const html = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
        res.on("error", reject);
      });
    });

    assert.match(html, /iNoU Platform/);
    assert.match(html, /id="command-input"/);
    assert.match(html, /data-tab="conversation"/);
    assert.match(html, /id="llm-config-dialog"/);
    assert.doesNotMatch(html, /name="apiKey"/i);
  });

  await t.test("serves resolvable browser module imports", async () => {
    const appSource = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/app.js`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
        res.on("error", reject);
      });
    });

    const imports = [...appSource.matchAll(/from ["'](\.\/[^"']+)["']/g)].map(
      (match) => match[1],
    );
    assert.ok(imports.length > 0);
    assert.match(appSource, /uiMode:\s*true/);
    assert.match(appSource, /\/api\/llm\/configurations/);

    for (const modulePath of imports) {
      assert.match(modulePath, /\.js$/);
      const statusCode = await new Promise((resolve, reject) => {
        http.get(
          `http://localhost:${testPort}/${modulePath.slice(2)}`,
          (res) => {
            res.resume();
            res.on("end", () => resolve(res.statusCode));
            res.on("error", reject);
          },
        );
      });
      assert.equal(statusCode, 200);
    }
  });
});

test("LLM configuration HTTP integration", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(__dirname, "tmp_llm_http_"));
  const server = startWebServer({ port: 0, rootDir: scratchDir });
  if (!server.listening) {
    await new Promise((resolve) => server.once("listening", resolve));
  }
  t.after(() => {
    server.close();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  await t.test(
    "returns modal metadata when uiMode requests interaction",
    async () => {
      const response = await requestJson(server, "POST", "/api/command", {
        command: "llm add gemini",
        uiMode: true,
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.status, "input_required");
      assert.equal(response.body.uiAction.type, "LLM_CONFIGURATION");
      assert.equal(response.body.uiAction.setup.engineName, "gemini");
      assert.equal(
        response.body.uiAction.setup.defaultModel,
        "gemini-3.6-flash",
      );
    },
  );

  await t.test("rejects secret fields from external callers", async () => {
    const response = await requestJson(
      server,
      "POST",
      "/api/llm/configurations",
      {
        configurationName: "unsafe",
        engineName: "gemini",
        model: "gemini-3.6-flash",
        apiKey: "must-not-be-accepted",
      },
    );

    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /not accepted/i);
  });

  await t.test(
    "creates, lists, and removes a profile through REST",
    async () => {
      const created = await requestJson(
        server,
        "POST",
        "/api/llm/configurations",
        {
          configurationName: "browser-planner",
          engineName: "gemini",
          model: "gemini-3.6-flash",
          supportsPlanMode: true,
          supportsExecuteMode: false,
        },
      );
      assert.equal(created.statusCode, 201);
      assert.equal(
        created.body.configuration.configurationName,
        "browser-planner",
      );
      assert.equal(Object.hasOwn(created.body.configuration, "apiKey"), false);

      const listed = await requestJson(
        server,
        "GET",
        "/api/llm/configurations",
      );
      assert.equal(listed.body.configurations.length, 1);

      const removed = await requestJson(
        server,
        "DELETE",
        "/api/llm/configurations/browser-planner",
      );
      assert.equal(removed.statusCode, 200);
    },
  );
});
