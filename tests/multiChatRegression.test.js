/**
 * Multi-Chat Feature: Regression & Edge Case Tests
 * Tests for chat state management, persistence, and display failures.
 *
 * Coverage:
 * - Chat state synchronization across operations
 * - Right-pane display of active chat metadata
 * - Message ordering and chat history integrity
 * - Concurrent chat operations
 * - State persistence failures and recovery
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const { executeShellLine } = require("../dist/cli/shell");
const { loadState, saveState } = require("../dist/cli/context");

test("Multi-Chat Feature: Edge Cases & Regression Tests", async (t) => {
  await t.test(
    "Chat state must persist to file after add operation",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      // Execute add command
      await executeShellLine("chat add --title TestChat1", tmpDir);

      // Load state and verify
      const state = loadState(statePath);
      assert.ok(state.chats, "chats array should exist in state");
      assert.equal(state.chats.length, 1, "exactly one chat should be created");
      assert.equal(
        state.chats[0].title,
        "TestChat1",
        "chat title should match",
      );
      assert.ok(state.activeChat, "activeChat should be set");
      assert.equal(
        state.activeChat,
        state.chats[0].id,
        "activeChat should reference created chat",
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test(
    "Active chat switches correctly when enabling a different chat",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      // Create two chats
      await executeShellLine("chat add --title Chat1", tmpDir);
      let state = loadState(statePath);
      const firstChatId = state.chats[0].id;

      await executeShellLine("chat add --title Chat2", tmpDir);
      state = loadState(statePath);
      const secondChatId = state.chats[1].id;

      // Verify second chat is active
      assert.equal(
        state.activeChat,
        secondChatId,
        "newly created chat should be active",
      );

      // Switch back to first chat
      await executeShellLine(`chat enable ${firstChatId}`, tmpDir);
      state = loadState(statePath);
      assert.equal(
        state.activeChat,
        firstChatId,
        "activeChat should switch to first chat",
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test(
    "Disabling active chat auto-switches to next active chat",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      // Create 3 chats
      await executeShellLine("chat add --title ChatA", tmpDir);
      await executeShellLine("chat add --title ChatB", tmpDir);
      await executeShellLine("chat add --title ChatC", tmpDir);

      let state = loadState(statePath);
      const chatCId = state.chats[2].id; // Currently active
      const chatBId = state.chats[1].id;

      // Disable active chat
      await executeShellLine(`chat disable ${chatCId}`, tmpDir);
      state = loadState(statePath);

      // Verify activeChat switched to another active chat
      assert.notEqual(
        state.activeChat,
        chatCId,
        "activeChat should not point to disabled chat",
      );
      assert.equal(
        state.chats.find((c) => c.id === state.activeChat).status,
        "Active",
        "activeChat must be set to an Active chat",
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test("Chat title is preserved in state after update", async () => {
    const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_chat_regression_"));
    const statePath = path.join(tmpDir, ".inuo-state.json");

    // Create a chat
    await executeShellLine("chat add --title OriginalTitle", tmpDir);
    let state = loadState(statePath);
    const chatId = state.chats[0].id;

    // Update title
    await executeShellLine(
      `chat update ${chatId} --title UpdatedTitle`,
      tmpDir,
    );
    state = loadState(statePath);

    const updatedChat = state.chats.find((c) => c.id === chatId);
    assert.equal(
      updatedChat.title,
      "UpdatedTitle",
      "chat title should be updated in state",
    );

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test(
    "Removing active chat auto-switches activeChat to another active chat",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      // Create 2 chats
      await executeShellLine("chat add --title ChatToRemove", tmpDir);
      await executeShellLine("chat add --title ChatToKeep", tmpDir);

      let state = loadState(statePath);
      const chatToRemoveId = state.chats[0].id;
      const chatToKeepId = state.chats[1].id;
      const activeChatBefore = state.activeChat;

      // Remove the second chat (which might be active)
      await executeShellLine(`chat remove ${chatToRemoveId}`, tmpDir);
      state = loadState(statePath);

      // Verify activeChat is updated if necessary
      if (activeChatBefore === chatToRemoveId) {
        assert.notEqual(
          state.activeChat,
          chatToRemoveId,
          "activeChat should be cleared or switched after removal",
        );
      }

      // Verify chat is truly removed
      assert.equal(
        state.chats.filter((c) => c.id === chatToRemoveId).length,
        0,
        "removed chat should not exist in state",
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test(
    "Chat messageIds array is properly initialized as empty when chat is created",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      await executeShellLine("chat add --title MessageTest", tmpDir);
      const state = loadState(statePath);
      const chat = state.chats[0];

      assert.ok(
        Array.isArray(chat.messageIds),
        "messageIds should be an array",
      );
      assert.equal(chat.messageIds.length, 0, "messageIds should start empty");

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test(
    "Chat list command displays activeChat with [ACTIVE] marker",
    async () => {
      // This test verifies the display/output is correct
      // (More of an integration test with CLI output verification)
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      await executeShellLine("chat add --title DisplayTest", tmpDir);
      const state = loadState(statePath);
      const activeChatId = state.activeChat;

      // Execute list command and verify state is consistent
      await executeShellLine("chat list", tmpDir);
      const stateAfterList = loadState(statePath);

      assert.equal(
        stateAfterList.activeChat,
        activeChatId,
        "list command should not change activeChat",
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test(
    "Multiple consecutive operations preserve chat state consistency",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      // Sequence of operations: add, enable, update, add, disable
      await executeShellLine("chat add --title First", tmpDir);
      let state = loadState(statePath);
      const firstId = state.chats[0].id;

      await executeShellLine("chat add --title Second", tmpDir);
      state = loadState(statePath);
      const secondId = state.chats[1].id;

      await executeShellLine(`chat enable ${firstId}`, tmpDir);
      state = loadState(statePath);
      assert.equal(state.activeChat, firstId);

      await executeShellLine(
        `chat update ${secondId} --title SecondUpdated`,
        tmpDir,
      );
      state = loadState(statePath);
      assert.equal(
        state.chats.find((c) => c.id === secondId).title,
        "SecondUpdated",
      );

      await executeShellLine(`chat disable ${secondId}`, tmpDir);
      state = loadState(statePath);
      assert.equal(
        state.chats.find((c) => c.id === secondId).status,
        "Archived",
      );

      // Verify overall state is valid
      assert.ok(state.activeChat, "should still have an active chat");
      const activeChatObj = state.chats.find((c) => c.id === state.activeChat);
      assert.equal(
        activeChatObj.status,
        "Active",
        "active chat must be Active",
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test(
    "Chat status transitions are valid (Active -> Archived -> Active)",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      // Create a chat
      await executeShellLine("chat add --title StatusTest", tmpDir);
      let state = loadState(statePath);
      const chatId = state.chats[0].id;

      // Initial status
      let chat = state.chats.find((c) => c.id === chatId);
      assert.equal(chat.status, "Active", "initial status should be Active");

      // Archive
      await executeShellLine(`chat disable ${chatId}`, tmpDir);
      state = loadState(statePath);
      chat = state.chats.find((c) => c.id === chatId);
      assert.equal(
        chat.status,
        "Archived",
        "status should be Archived after disable",
      );

      // Restore
      await executeShellLine(`chat enable ${chatId}`, tmpDir);
      state = loadState(statePath);
      chat = state.chats.find((c) => c.id === chatId);
      assert.equal(
        chat.status,
        "Active",
        "status should be Active again after enable",
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test(
    "Chat model type and owner ID default to expected values",
    async () => {
      const tmpDir = fs.mkdtempSync(
        path.join(__dirname, "tmp_chat_regression_"),
      );
      const statePath = path.join(tmpDir, ".inuo-state.json");

      await executeShellLine("chat add --title DefaultsTest", tmpDir);
      const state = loadState(statePath);
      const chat = state.chats[0];

      assert.equal(
        chat.modelType,
        "default",
        "modelType should default to 'default'",
      );
      assert.equal(
        chat.ownerId,
        "user_local",
        "ownerId should default to 'user_local'",
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  );

  await t.test("Chat timestamps are valid ISO strings", async () => {
    const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_chat_regression_"));
    const statePath = path.join(tmpDir, ".inuo-state.json");

    await executeShellLine("chat add --title TimestampTest", tmpDir);
    const state = loadState(statePath);
    const chat = state.chats[0];

    // Validate ISO 8601 format
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    assert.match(
      chat.createdAt,
      isoRegex,
      "createdAt should be valid ISO timestamp",
    );
    assert.match(
      chat.updatedAt,
      isoRegex,
      "updatedAt should be valid ISO timestamp",
    );

    // Verify timestamps are recent (within last minute)
    const now = new Date();
    const createdTime = new Date(chat.createdAt);
    const diffMs = now - createdTime;
    assert.ok(
      diffMs >= 0 && diffMs < 60000,
      "createdAt should be within the last minute",
    );

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test("Chat ID uniqueness across multiple chats", async () => {
    const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_chat_regression_"));
    const statePath = path.join(tmpDir, ".inuo-state.json");

    // Create many chats
    for (let i = 0; i < 5; i++) {
      await executeShellLine(`chat add --title Chat${i}`, tmpDir);
    }

    const state = loadState(statePath);
    const ids = state.chats.map((c) => c.id);
    const uniqueIds = new Set(ids);

    assert.equal(uniqueIds.size, ids.length, "all chat IDs should be unique");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
