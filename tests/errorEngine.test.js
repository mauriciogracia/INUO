const test = require("node:test");
const assert = require("node:assert/strict");
const { formatTechnicalError } = require("../dist/cli/errorEngine");

test("Technical Error Natural Language Representation Engine Unit Tests", async (t) => {
  await t.test(
    "formats 429 / RESOURCE_EXHAUSTED / quota exceeded in Spanish",
    () => {
      const err = new Error("GoogleGenerativeAI Error: [429 Too Many Requests] RESOURCE_EXHAUSTED: Resource has been exhausted (e.g. check quota).");
      const formatted = formatTechnicalError(err, "es");
      assert.match(formatted, /Límite de Cuota/i);
      assert.match(formatted, /cuota de tokens o límite de solicitudes/i);
    },
  );

  await t.test(
    "formats token quota / rate limit in English",
    () => {
      const err = { status: 429, message: "Rate limit exceeded" };
      const formatted = formatTechnicalError(err, "en");
      assert.match(formatted, /Quota Limit/i);
      assert.match(formatted, /Token quota or rate limit reached/i);
    },
  );

  await t.test(
    "formats token quota error across French, German, and Portuguese",
    () => {
      const err = new Error("API token quota exceeded");
      const frFormatted = formatTechnicalError(err, "fr");
      assert.match(frFormatted, /Limite de Quota/i);
      assert.match(frFormatted, /Quota de jetons/i);

      const deFormatted = formatTechnicalError(err, "de");
      assert.match(deFormatted, /Kontingentlimit/i);
      assert.match(deFormatted, /Token-Kontingent/i);

      const ptFormatted = formatTechnicalError(err, "pt");
      assert.match(ptFormatted, /Limite de Cota/i);
      assert.match(ptFormatted, /Cota de tokens/i);
    },
  );

  await t.test(
    "formats invalid or unauthorized API key in Spanish and English",
    () => {
      const err = new Error("API_KEY_INVALID: API key not valid. Please pass a valid API key.");
      const esFormatted = formatTechnicalError(err, "es");
      assert.match(esFormatted, /Clave Inválida/i);
      assert.match(esFormatted, /key <API_KEY>/i);

      const enFormatted = formatTechnicalError(err, "en");
      assert.match(enFormatted, /Invalid Key/i);
      assert.match(enFormatted, /key <API_KEY>/i);
    },
  );

  await t.test(
    "formats network and connection errors into friendly natural language",
    () => {
      const netErr = new Error("fetch failed: connect ECONNREFUSED 127.0.0.1:443");
      const formatted = formatTechnicalError(netErr, "es");
      assert.match(formatted, /Error de Red/i);
      assert.match(formatted, /conexión a internet/i);
    },
  );

  await t.test(
    "formats service unavailable / overloaded errors into friendly natural language",
    () => {
      const unavailableErr = { status: 503, message: "Service Unavailable" };
      const formatted = formatTechnicalError(unavailableErr, "es");
      assert.match(formatted, /Servicio No Disponible/i);
      assert.match(formatted, /temporalmente sobrecargado/i);
    },
  );

  await t.test(
    "formats unexpected generic technical errors cleanly",
    () => {
      const genericErr = new Error("Unexpected token < in JSON at position 0");
      const formatted = formatTechnicalError(genericErr, "es");
      assert.match(formatted, /Error Técnico/i);
      assert.match(formatted, /Unexpected token/i);
    },
  );
});
