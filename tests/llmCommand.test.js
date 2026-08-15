const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { runLLMCommand, getLLMProviderSetup } = require("../dist/cli/llmCommand");
const { executeShellLine } = require("../dist/cli/shell");
const { loadState } = require("../dist/cli/context");

test("LLM provider configuration command", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(__dirname, "tmp_llm_command_"));
  const statePath = path.join(scratchDir, ".inuo-state.json");

  function captureLogs() {
    const lines = [];
    const original = console.log;
    console.log = (...args) => {
      lines.push(args.map((arg) => String(arg)).join(" "));
    };
    return {
      lines,
      restore() {
        console.log = original;
      },
    };
  }

  await t.test("prompts only for non-secret provider details", async () => {
    const answers = ["planner-primary", "gemini-flash-latest", "", "yes", "no"];
    const questions = [];
    const prompter = {
      async ask(question, defaultValue) {
        questions.push(question);
        const answer = answers.shift();
        return answer || defaultValue || "";
      },
    };

    await runLLMCommand(["add", "gemini"], scratchDir, prompter);

    assert.equal(
      questions.some((question) => /api key|secret|token/i.test(question)),
      false,
    );
    const configuration = loadState(statePath).llmConfigurations[0];
    assert.equal(configuration.configurationName, "planner-primary");
    assert.equal(configuration.engineName, "gemini");
    assert.equal(configuration.supportsPlanMode, true);
    assert.equal(configuration.supportsExecuteMode, false);
    assert.equal(configuration.credentialEnvironmentVariable, "GEMINI_API_KEY");
    assert.equal(Object.hasOwn(configuration, "apiKey"), false);
  });

  await t.test("autoconfigures provider presets and aliases without requiring manual flags", async () => {
    // 1. Test alias 'google' -> autoconfigures 'gemini' defaults
    await runLLMCommand(["add", "google", "--name", "google-auto"], scratchDir);
    // 2. Test alias 'claude' -> autoconfigures 'anthropic' defaults
    await runLLMCommand(["add", "claude"], scratchDir);
    // 3. Test 'groq' provider defaults
    await runLLMCommand(["add", "groq"], scratchDir);

    const configs = loadState(statePath).llmConfigurations;
    const googleCfg = configs.find((c) => c.configurationName === "google-auto");
    assert.ok(googleCfg);
    assert.equal(googleCfg.engineName, "gemini");
    assert.equal(googleCfg.model, "gemini-flash-latest");
    assert.equal(googleCfg.credentialEnvironmentVariable, "GEMINI_API_KEY");

    const claudeCfg = configs.find((c) => c.configurationName === "anthropic-default");
    assert.ok(claudeCfg);
    assert.equal(claudeCfg.engineName, "anthropic");
    assert.equal(claudeCfg.model, "claude-3-5-sonnet-20241022");
    assert.equal(claudeCfg.credentialEnvironmentVariable, "ANTHROPIC_API_KEY");

    const groqCfg = configs.find((c) => c.configurationName === "groq-default");
    assert.ok(groqCfg);
    assert.equal(groqCfg.engineName, "groq");
    assert.equal(groqCfg.model, "llama-3.3-70b-versatile");
    assert.equal(groqCfg.credentialEnvironmentVariable, "GROQ_API_KEY");
  });

  await t.test("rejects duplicate configuration names", async () => {
    await runLLMCommand(
      ["add", "openai", "--name", "planner-primary", "--model", "gpt-4o"],
      scratchDir,
    );

    const configs = loadState(statePath).llmConfigurations;
    assert.equal(configs.filter((c) => c.configurationName === "planner-primary").length, 1);
  });

  await t.test(
    "stores plan and execute support supplied through flags",
    async () => {
      await executeShellLine(
        "llm add ollama --name local-executor --model llama3.2 --base-url http://localhost:11434 --plan no --execute yes",
        scratchDir,
      );

      const configuration = loadState(statePath).llmConfigurations.find(
        (item) => item.configurationName === "local-executor",
      );
      assert.ok(configuration);
      assert.equal(configuration.supportsPlanMode, false);
      assert.equal(configuration.supportsExecuteMode, true);
      assert.equal(configuration.baseUrl, "http://localhost:11434");
      assert.equal(configuration.credentialEnvironmentVariable, undefined);
    },
  );

  await t.test("supports copilot provider defaults", async () => {
    await runLLMCommand(
      [
        "add",
        "copilot",
        "--name",
        "copilot-default",
        "--model",
        "gpt-4.1",
        "--plan",
        "yes",
        "--execute",
        "yes",
      ],
      scratchDir,
    );

    const configuration = loadState(statePath).llmConfigurations.find(
      (item) => item.configurationName === "copilot-default",
    );
    assert.ok(configuration);
    assert.equal(configuration.engineName, "copilot");
    assert.equal(configuration.credentialEnvironmentVariable, undefined);
    assert.equal(configuration.supportsExecuteMode, true);
  });

  await t.test("prints llm status summary", async () => {
    const capture = captureLogs();
    try {
      await runLLMCommand(["status"], scratchDir);
    } finally {
      capture.restore();
    }

    const output = capture.lines.join("\n");
    assert.match(output, /=== LLM Status ===/);
    assert.match(output, /copilot=1/);
  });

  await t.test("removes a configuration by its unique name", async () => {
    await runLLMCommand(["remove", "planner-primary"], scratchDir);

    const names = loadState(statePath).llmConfigurations.map(
      (item) => item.configurationName,
    );
    assert.equal(names.includes("planner-primary"), false);
  });

  fs.rmSync(scratchDir, { recursive: true, force: true });
});
