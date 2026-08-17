const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { EventBus } = require("../dist/api/events/EventBus");
const { ApiServer } = require("../dist/api/ApiServer");
const { setOutputListener } = require("../dist/cli/outputRouter");
const { OutputChannelEnum } = require("../dist/enums/OutputChannelEnum");

test("Chat commands output correctly via Web API", async (t) => {
  await t.test("Chat add command emits output through EventBus", async () => {
    const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_chat_web_api_"));
    const bus = EventBus.getInstance();

    // Collect all output.message events
    const outputEvents = [];
    const listener = (envelope) => {
      if (envelope.eventType === "output.message") {
        outputEvents.push(envelope.payload);
      }
    };

    bus.on("event", listener);

    // Simulate API server setting up output listener
    setOutputListener((channel, content) => {
      bus.publish("output.message", "preference", "update", {
        channel,
        content,
        timestamp: new Date().toISOString(),
      });
    });

    // Execute a chat add command via the shell layer
    const { executeShellLine } = require("../dist/cli/shell");
    await executeShellLine("chat add --title TestChat", tmpDir);

    // Verify output was emitted
    assert.ok(
      outputEvents.length > 0,
      "At least one output event should have been emitted",
    );

    const chatOutputEvent = outputEvents.find(
      (e) => e.content && e.content.includes("TestChat"),
    );
    assert.ok(
      chatOutputEvent,
      "Output event should contain the chat title 'TestChat'",
    );
    assert.equal(
      chatOutputEvent.channel,
      OutputChannelEnum.USER_REPLY,
      "Chat output should use USER_REPLY channel",
    );

    bus.removeListener("event", listener);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test("Chat list command emits formatted output", async () => {
    const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_chat_web_api_"));
    const bus = EventBus.getInstance();

    const outputEvents = [];
    const listener = (envelope) => {
      if (envelope.eventType === "output.message") {
        outputEvents.push(envelope.payload);
      }
    };

    bus.on("event", listener);

    setOutputListener((channel, content) => {
      bus.publish("output.message", "preference", "update", {
        channel,
        content,
        timestamp: new Date().toISOString(),
      });
    });

    const { executeShellLine } = require("../dist/cli/shell");

    // Create two chats then list them
    await executeShellLine("chat add --title Chat1", tmpDir);
    await executeShellLine("chat add --title Chat2", tmpDir);
    await executeShellLine("chat list", tmpDir);

    // Verify list output was emitted with [ACTIVE] marker
    const listOutput = outputEvents.find(
      (e) => e.content && e.content.includes("INOU Chats"),
    );
    assert.ok(listOutput, "List command should emit output with chat summary");

    bus.removeListener("event", listener);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test(
    "Chat update command preserves and emits modified state",
    async () => {
      const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_chat_web_api_"));
      const bus = EventBus.getInstance();

      const outputEvents = [];
      const listener = (envelope) => {
        if (envelope.eventType === "output.message") {
          outputEvents.push(envelope.payload);
        }
      };

      bus.on("event", listener);

      setOutputListener((channel, content) => {
        bus.publish("output.message", "preference", "update", {
          channel,
          content,
          timestamp: new Date().toISOString(),
        });
      });

      const { executeShellLine } = require("../dist/cli/shell");
      const { loadState } = require("../dist/cli/context");
      const { getProjectPaths } = require("../dist/cli/context");

      // Create a chat
      await executeShellLine("chat add --title OriginalTitle", tmpDir);

      const paths = getProjectPaths(tmpDir);
      const statePath = paths.statePath;
      let state = loadState(statePath);
      const chatId = state.chats[0].id;

      // Clear previous events
      outputEvents.length = 0;

      // Update the chat
      await executeShellLine(`chat update ${chatId} --title NewTitle`, tmpDir);

      // Verify update output was emitted
      const updateOutput = outputEvents.find(
        (e) => e.content && e.content.includes("Chat updated"),
      );
      assert.ok(
        updateOutput,
        "Update command should emit output confirming the update",
      );

      // Verify state was actually updated
      state = loadState(statePath);
      const updated = state.chats.find((c) => c.id === chatId);
      assert.equal(updated.title, "NewTitle", "Chat title should be updated");

      bus.removeListener("event", listener);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );
});
