const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const path = require("path");
const { startWebServer } = require("../dist/cli/webServer");

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
