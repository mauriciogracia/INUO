import readline from "readline";
import { createContext, getProjectPaths, loadState } from "./context";
import { runBootstrap } from "./bootstrapCommand";
import { runStatus } from "./statusCommand";
import { runCatalog } from "./catalogCommand";
import { runNeedCommand } from "./needCommand";
import { runOfferCommand } from "./offerCommand";
import { runMatchCommand } from "./matchCommand";
import { runTest } from "./testCommand";
import { runRollback } from "./rollbackCommand";
import {
  getStoredApiKey,
  saveApiKey,
  processNaturalLanguageIntent,
} from "./aiClient";
import { checkAndApplySyncProtocol } from "./syncEngine";
import { runEvolveCommand } from "./evolveCommand";
import { runDetailCommand, runAnswerCommand } from "./detailCommand";
import {
  runRoleCommand,
  runPrincipleCommand,
  runBehaviorCommand,
  runSkillCommand,
} from "./governanceCommand";
import { runWhoamiCommand, runUserSetCommand } from "./userCommand";
import {
  processUserCorrection,
  exportTrainingData,
  mergeTrainingData,
} from "./learningEngine";
import { runForgetCommand } from "./forgetCommand";
import { detectPrincipleIncoherence } from "./incoherenceEngine";
import { detectManipulationAttempt } from "./manipulationDefenseEngine";
import { runMCPCommand } from "./mcpCommand";
import { runColmenaCommand } from "./colmenaCommand";
import { runDeviceCommand } from "./deviceCommand";
import {
  generateSelfAwarenessResponse,
  generateSelfAwarenessResponseWithLLMFallback,
} from "./selfAwarenessEngine";
import {
  triggerEmergencyIncapacitation,
  authorizeEmergencyCommand,
} from "./emergencyEngine";
import { writeOutput } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";
import { LogLevelEnum } from "../enums/LogLevelEnum";
import { runMasterMindCommand } from "./masterMindCommand";
import { runMemberCommand } from "./memberCommand";
import { runEngineCommand } from "./engineCommand";
import { runAuthCommand } from "./authCommand";
import { runThresholdCommand } from "./thresholdCommand";
import { runModeCommand } from "./modeCommand";
import { detectLanguage } from "./languageEngine";
import {
  initiateHostGreeting,
  setInteractionLanguage,
} from "./hostServiceEngine";
import { runSocialCommand } from "./socialCommand";
import { runQuestionCommand } from "./questionCommand";
import { calculateInuoVersion } from "./versionEngine";
import { runVersionCommand } from "./versionCommand";
import { INUOTerminalUI } from "./tuiEngine";
import { runGCCommand } from "./gcCommand";
import { TOOL_NAME, TOOL_CMD } from "./brand";
import { handleFormatSignal } from "./preferenceEngine";

export async function executeShellLine(
  trimmed: string,
  rootDir: string = process.cwd(),
): Promise<void> {
  if (!trimmed) return;

  const paths = getProjectPaths(rootDir);
  const stateData = loadState(paths.statePath);

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case "version":
    case "-v":
    case "--version":
      runVersionCommand(parts.slice(1), rootDir);
      break;

    case "question":
      runQuestionCommand(parts.slice(1), rootDir);
      break;

    case "social":
      runSocialCommand(parts.slice(1), rootDir);
      break;

    case "mode":
      runModeCommand(parts.slice(1), rootDir);
      break;

    case "promptme":
      runModeCommand(["promptMe"], rootDir);
      break;

    case "letmeserveyou":
    case "serve":
      runModeCommand(["letMeServeYou"], rootDir);
      break;

    case "succinct":
    case "succinctmode":
      runModeCommand(["succinct", ...parts.slice(1)], rootDir);
      break;

    case "debug":
    case "debuglevel":
    case "loglevel":
      runModeCommand(["debug", ...parts.slice(1)], rootDir);
      break;

    case "auth":
      runAuthCommand(parts.slice(1), rootDir);
      break;

    case "signin":
    case "login":
      runAuthCommand(["signin", ...parts.slice(1)], rootDir);
      break;

    case "signout":
    case "logout":
      runAuthCommand(["signout"], rootDir);
      break;

    case "threshold":
      runThresholdCommand(parts.slice(1), rootDir);
      break;

    case "whoami":
      runWhoamiCommand(rootDir);
      break;

    case "user":
      if (parts[1]?.toLowerCase() === "set") {
        runUserSetCommand(parts.slice(2), rootDir);
      } else {
        runWhoamiCommand(rootDir);
      }
      break;

    case "member":
      runMemberCommand(parts.slice(1), rootDir);
      break;

    case "device":
      runDeviceCommand(parts.slice(1), rootDir);
      break;

    case "engine":
      runEngineCommand(parts.slice(1), rootDir);
      break;

    case "mastermind":
      runMasterMindCommand(parts.slice(1), rootDir);
      break;

    case "role":
      runRoleCommand(parts.slice(1), rootDir);
      break;

    case "principle":
      runPrincipleCommand(parts.slice(1), rootDir);
      break;

    case "behavior":
      runBehaviorCommand(parts.slice(1), rootDir);
      break;

    case "skill":
      runSkillCommand(parts.slice(1), rootDir);
      break;

    case "mcp":
      runMCPCommand(parts.slice(1), rootDir);
      break;

    case "colmena":
      runColmenaCommand(parts.slice(1), rootDir);
      break;

    case "forget":
      runForgetCommand(parts.slice(1), rootDir);
      break;

    case "learn":
    case "correct":
      if (parts[1] && parts[2]) {
        processUserCorrection(parts[1], parts.slice(2).join(" "), rootDir);
      } else {
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          "Usage: learn <topic> <learned_directive_rule>",
        );
      }
      break;

    case "export-training":
      exportTrainingData(rootDir);
      break;

    case "merge-training":
      mergeTrainingData(rootDir);
      break;

    case "evolve":
      runEvolveCommand(rootDir);
      break;

    case "sync":
      const syncResult = checkAndApplySyncProtocol(rootDir);
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        `[${TOOL_NAME} Sync Engine] Status: ${syncResult.status} | Message: ${syncResult.message}`,
      );
      break;

    case "key":
      if (!parts[1]) {
        const storedKey = getStoredApiKey(rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `Current Gemini API Key: ${storedKey ? "Connected (****" + storedKey.slice(-4) + ")" : "Not Set"}`,
        );
      } else {
        saveApiKey(parts[1], rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          "✔ Successfully saved and connected Google Gemini API key!",
        );
      }
      break;

    case "init":
    case "bootstrap":
      runBootstrap(rootDir);
      break;

    case "status":
      runStatus(rootDir);
      break;

    case "gc":
    case "chrome":
    case "browser":
      runGCCommand(3000, rootDir);
      break;

    case "catalog":
      runCatalog(parts.slice(1), rootDir);
      break;

    case "need":
      runNeedCommand(parts.slice(1), rootDir);
      break;

    case "offer":
      runOfferCommand(parts.slice(1), rootDir);
      break;

    case "match":
      runMatchCommand(rootDir);
      break;

    case "detail":
      await runDetailCommand(parts.slice(1), rootDir);
      break;

    case "answer":
      runAnswerCommand(parts.slice(1), rootDir);
      break;

    case "test":
      runTest(parts[1], rootDir);
      break;

    case "rollback":
      if (!parts[1]) {
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          "Usage: rollback <target_version>",
        );
      } else {
        runRollback(parts[1], rootDir);
      }
      break;

    case "help":
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        `${TOOL_NAME} Supported Commands:\nneed create, offer create, match, detail, answer, status, catalog, version, mode, succinct, debug, auth, exit`,
      );
      break;

    case "exit":
    case "quit":
    case "q":
    case "bye":
    case "goodbye":
    case "chao":
    case "chau":
    case "adios":
    case "ciao":
    case "sayonara":
    case "aufwiedersehen":
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        `Exiting ${TOOL_NAME} shell. ¡Hasta luego! / Goodbye! / Chao!`,
      );
      process.exit(0);

    default:
      if (stateData?.operatingMode?.autoDetectLanguage) {
        const detectedLang = detectLanguage(trimmed);
        setInteractionLanguage(detectedLang, true, rootDir);
      }

      // Emergency & Manipulation Checks
      const activeUser = stateData?.activeUser;

      const emergencyAuth = authorizeEmergencyCommand(
        activeUser?.userId || "user_local",
        activeUser?.isFamilyMember || false,
        trimmed,
        rootDir,
      );

      if (!emergencyAuth.allowed) {
        writeOutput(OutputChannelEnum.USER_REPLY, emergencyAuth.reason);
        break;
      }

      const manipulationCheck = detectManipulationAttempt(
        trimmed,
        "UserInput",
        rootDir,
      );
      if (manipulationCheck.isManipulative) {
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `❌ [Manipulation Blocked] Security Engine rejected input prompt: ${manipulationCheck.explanation}`,
        );
        break;
      }

      // Format preference signal — handled locally, no LLM needed
      const userId = activeUser?.userId ?? "user_local";
      const lang = stateData?.operatingMode?.detectedLanguage ?? "en";
      if (handleFormatSignal(trimmed, userId, lang, rootDir)) break;

      const lowerTrimmed = trimmed.toLowerCase();
      if (
        lowerTrimmed.includes("who are you") ||
        lowerTrimmed.includes("tell me about yourself") ||
        lowerTrimmed.includes("what are your principles") ||
        lowerTrimmed.includes(`what is ${TOOL_CMD}`) ||
        lowerTrimmed.includes("quien eres") ||
        lowerTrimmed.includes("quién eres")
      ) {
        const selfAwareness =
          await generateSelfAwarenessResponseWithLLMFallback(
            activeUser?.userId || "user_local",
            "User",
            trimmed,
            rootDir,
          );
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          selfAwareness.generatedResponseText,
        );
        break;
      }

      const incoherence = detectPrincipleIncoherence(trimmed, rootDir);
      if (incoherence.hasIncoherence) {
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `❌ [Incoherence Detected] Execution Blocked! Prompt conflicts with Principle "${incoherence.conflictingPrincipleName}": ${incoherence.explanation}`,
        );
        break;
      }

      const currentDebug =
        stateData?.operatingMode?.debugLevel !== undefined
          ? stateData.operatingMode.debugLevel
          : 1;
      const result = await processNaturalLanguageIntent(trimmed, rootDir);

      if (result) {
        if (
          result.type === "COMMAND_SEQUENCE" ||
          (result.commandSequence && result.commandSequence.length > 0)
        ) {
          const seq = result.commandSequence || [];
          if (result.explanation) {
            writeOutput(OutputChannelEnum.USER_REPLY, result.explanation);
          }
          for (const cmdLine of seq) {
            await executeShellLine(cmdLine, rootDir);
          }
        } else if (result.type === "NEED" && result.verb && result.object) {
          writeOutput(
            OutputChannelEnum.USER_REPLY,
            `✔ AI Parsed Need Intent: ${result.explanation || ""}`,
          );
          runNeedCommand(
            ["create", "--verb", result.verb, "--object", result.object],
            rootDir,
          );
        } else if (result.type === "OFFER" && result.verb && result.object) {
          writeOutput(
            OutputChannelEnum.USER_REPLY,
            `✔ AI Parsed Offer Intent: ${result.explanation || ""}`,
          );
          runOfferCommand(
            ["create", "--verb", result.verb, "--object", result.object],
            rootDir,
          );
        } else if (
          result.type === "DETAIL_PLAN" &&
          result.verb &&
          result.object
        ) {
          writeOutput(
            OutputChannelEnum.USER_REPLY,
            `✔ AI Parsed Detailing & Planning Goal: ${result.explanation || ""}`,
          );
          runNeedCommand(
            ["create", "--verb", result.verb, "--object", result.object],
            rootDir,
          );
          await runDetailCommand(["1", "decompose", trimmed], rootDir);
        } else if (result.type === "ANSWER" && result.answerText) {
          writeOutput(
            OutputChannelEnum.USER_REPLY,
            `✔ AI Parsed Knowledge Answer: ${result.explanation || ""}`,
          );
          runAnswerCommand(
            [result.targetIdOrCode || "1", result.answerText],
            rootDir,
          );
        } else if (result.type === "CORRECTION" && result.correctionText) {
          writeOutput(
            OutputChannelEnum.USER_REPLY,
            `✔ AI Parsed User Correction: ${result.explanation || ""}`,
          );
          processUserCorrection(
            result.correctionTopic || "General",
            result.correctionText,
            rootDir,
          );
        } else if (result.type === "EXIT") {
          writeOutput(
            OutputChannelEnum.USER_REPLY,
            result.explanation || `Exiting ${TOOL_NAME} shell. ¡Hasta luego!`,
          );
          process.exit(0);
        } else if (result.explanation) {
          writeOutput(OutputChannelEnum.USER_REPLY, result.explanation);
        }
      }
      break;
  }
}

export function startInteractiveShell(rootDir: string = process.cwd()): void {
  const syncRes = checkAndApplySyncProtocol(rootDir);
  const inuoVer = calculateInuoVersion(rootDir);
  const version = inuoVer.fullVersionString;

  // Initialize Split-Pane Terminal UI (TUI)
  const tui = new INUOTerminalUI({
    version,
    rootDir,
    onCommand: async (cmd: string) => {
      await executeShellLine(cmd, rootDir);
    },
  });

  tui.start();
}

export function dispatchSingleCommand(
  args: string[],
  rootDir: string = process.cwd(),
): void {
  checkAndApplySyncProtocol(rootDir);
  const line = args.join(" ");
  executeShellLine(line, rootDir);
}
