const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { runLLMCommand } = require("../dist/cli/llmCommand");
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
    const answers = ["planner-primary", "gemini-3.6-flash", "", "yes", "no"];
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

  await t.test("rejects duplicate configuration names", async () => {
    await runLLMCommand(
      ["add", "openai", "--name", "planner-primary", "--model", "gpt-4o"],
      scratchDir,
    );

    assert.equal(loadState(statePath).llmConfigurations.length, 1);
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
    assert.match(output, /Total configurations: 3/);
    assert.match(output, /copilot=1/);
  });

  await t.test("removes a configuration by its unique name", async () => {
    await runLLMCommand(["remove", "planner-primary"], scratchDir);

    const names = loadState(statePath).llmConfigurations.map(
      (item) => item.configurationName,
    );
    assert.deepEqual(
      names.sort(),
      ["copilot-default", "local-executor"].sort(),
    );
  });

  fs.rmSync(scratchDir, { recursive: true, force: true });
});
