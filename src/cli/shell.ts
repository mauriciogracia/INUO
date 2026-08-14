import readline from 'readline';
import { createContext, getProjectPaths, loadState } from './context';
import { runBootstrap } from './bootstrapCommand';
import { runStatus } from './statusCommand';
import { runCatalog } from './catalogCommand';
import { runNeedCommand } from './needCommand';
import { runOfferCommand } from './offerCommand';
import { runMatchCommand } from './matchCommand';
import { runTest } from './testCommand';
import { runRollback } from './rollbackCommand';
import { getStoredApiKey, saveApiKey, processNaturalLanguageIntent } from './aiClient';
import { checkAndApplySyncProtocol } from './syncEngine';
import { runEvolveCommand } from './evolveCommand';
import { runDetailCommand, runAnswerCommand } from './detailCommand';
import { runRoleCommand, runPrincipleCommand, runBehaviorCommand, runSkillCommand } from './governanceCommand';
import { runWhoamiCommand, runUserSetCommand } from './userCommand';
import { processUserCorrection, exportTrainingData, mergeTrainingData } from './learningEngine';
import { runForgetCommand } from './forgetCommand';
import { detectPrincipleIncoherence } from './incoherenceEngine';
import { detectManipulationAttempt } from './manipulationDefenseEngine';
import { runMCPCommand } from './mcpCommand';
import { runColmenaCommand } from './colmenaCommand';
import { runDeviceCommand } from './deviceCommand';
import { generateSelfAwarenessResponse } from './selfAwarenessEngine';
import { triggerEmergencyIncapacitation, authorizeEmergencyCommand } from './emergencyEngine';
import { runMasterMindCommand } from './masterMindCommand';
import { runMemberCommand } from './memberCommand';
import { runEngineCommand } from './engineCommand';
import { runAuthCommand } from './authCommand';
import { runThresholdCommand } from './thresholdCommand';
import { runModeCommand } from './modeCommand';
import { detectLanguage } from './languageEngine';
import { initiateHostGreeting, setInteractionLanguage } from './hostServiceEngine';
import { runSocialCommand } from './socialCommand';
import { runQuestionCommand } from './questionCommand';
import { calculateInuoVersion } from './versionEngine';
import { runVersionCommand } from './versionCommand';

export function startInteractiveShell(rootDir: string = process.cwd()): void {
  const syncRes = checkAndApplySyncProtocol(rootDir);
  const inuoVer = calculateInuoVersion(rootDir);
  const version = inuoVer.fullVersionString;
  const hasKey = !!getStoredApiKey(rootDir);

  console.log('\x1b[36m%s\x1b[0m', '┌──────────────────────────────────────────────────────────┐');
  console.log('\x1b[36m%s\x1b[0m', `│  INUO Interactive Shell v${version.padEnd(31)} │`);
  console.log(
    '\x1b[36m%s\x1b[0m',
    `│  Protocol Sync Status: ${(syncRes.status === 'Synced' || syncRes.status === 'VerificationPassed' ? '\x1b[32mSynced (' + version + ')\x1b[36m' : '\x1b[33m' + syncRes.status + '\x1b[36m').padEnd(35)} │`
  );
  console.log('\x1b[36m%s\x1b[0m', `│  Gemini AI Status: ${(hasKey ? '\x1b[32mConnected\x1b[36m' : '\x1b[33mNot Connected\x1b[36m').padEnd(37)} │`);
  console.log('\x1b[36m%s\x1b[0m', '│  Type "help" for available commands or "exit" to quit.   │');
  console.log('\x1b[36m%s\x1b[0m', '└──────────────────────────────────────────────────────────┘');

  // Check operating mode greeting
  const host = initiateHostGreeting(rootDir);
  console.log(`\n\x1b[36m[Host Greeting]:\x1b[0m ${host.greeting}`);
  if (host.authRequired) {
    console.log(`\x1b[33m[Host Prompt]:\x1b[0m ${host.promptMessage}`);
  }

  const commands = [
    'version',
    'question',
    'social',
    'mode',
    'promptme',
    'letmeserveyou',
    'auth',
    'signin',
    'signout',
    'threshold',
    'whoami',
    'user',
    'member',
    'device',
    'engine',
    'mastermind',
    'role',
    'principle',
    'behavior',
    'skill',
    'mcp',
    'colmena',
    'forget',
    'learn',
    'correct',
    'export-training',
    'merge-training',
    'evolve',
    'sync',
    'key',
    'init',
    'bootstrap',
    'status',
    'catalog',
    'need',
    'offer',
    'match',
    'detail',
    'answer',
    'test',
    'rollback',
    'help',
    'exit',
    'quit',
  ];

  function completer(line: string) {
    const completions = commands;
    const hits = completions.filter((c) => c.startsWith(line.trim()));
    return [hits.length ? hits : completions, line];
  }

  const promptStr = `\x1b[32minuo (v${version})\x1b[0m > `;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
    prompt: promptStr,
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    // Auto Language Detection
    const paths = getProjectPaths(rootDir);
    const stateData = loadState(paths.statePath);
    if (stateData.operatingMode?.autoDetectLanguage) {
      const detectedLang = detectLanguage(trimmed);
      setInteractionLanguage(detectedLang, true, rootDir);
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case 'version':
      case '-v':
      case '--version':
        runVersionCommand(parts.slice(1), rootDir);
        break;

      case 'question':
        runQuestionCommand(parts.slice(1), rootDir);
        break;

      case 'social':
        runSocialCommand(parts.slice(1), rootDir);
        break;

      case 'mode':
        runModeCommand(parts.slice(1), rootDir);
        break;

      case 'promptme':
        runModeCommand(['promptMe'], rootDir);
        break;

      case 'letmeserveyou':
      case 'serve':
        runModeCommand(['letMeServeYou'], rootDir);
        break;

      case 'auth':
        runAuthCommand(parts.slice(1), rootDir);
        break;

      case 'signin':
      case 'login':
        runAuthCommand(['signin', ...parts.slice(1)], rootDir);
        break;

      case 'signout':
      case 'logout':
        runAuthCommand(['signout'], rootDir);
        break;

      case 'threshold':
        runThresholdCommand(parts.slice(1), rootDir);
        break;

      case 'whoami':
        runWhoamiCommand(rootDir);
        break;

      case 'user':
        if (parts[1]?.toLowerCase() === 'set') {
          runUserSetCommand(parts.slice(2), rootDir);
        } else {
          runWhoamiCommand(rootDir);
        }
        break;

      case 'member':
        runMemberCommand(parts.slice(1), rootDir);
        break;

      case 'device':
        runDeviceCommand(parts.slice(1), rootDir);
        break;

      case 'engine':
        runEngineCommand(parts.slice(1), rootDir);
        break;

      case 'mastermind':
        runMasterMindCommand(parts.slice(1), rootDir);
        break;

      case 'role':
        runRoleCommand(parts.slice(1), rootDir);
        break;

      case 'principle':
        runPrincipleCommand(parts.slice(1), rootDir);
        break;

      case 'behavior':
        runBehaviorCommand(parts.slice(1), rootDir);
        break;

      case 'skill':
        runSkillCommand(parts.slice(1), rootDir);
        break;

      case 'mcp':
        runMCPCommand(parts.slice(1), rootDir);
        break;

      case 'colmena':
        runColmenaCommand(parts.slice(1), rootDir);
        break;

      case 'forget':
        runForgetCommand(parts.slice(1), rootDir);
        break;

      case 'learn':
      case 'correct':
        if (!parts[1] || !parts[2]) {
          console.log('\x1b[33m%s\x1b[0m', 'Usage: learn <topic> <learned_directive_or_correction_text>');
        } else {
          processUserCorrection(parts[1], parts.slice(2).join(' '), rootDir);
        }
        break;

      case 'export-training':
        exportTrainingData(parts[1], rootDir);
        break;

      case 'merge-training':
        if (!parts[1]) {
          console.log('\x1b[33m%s\x1b[0m', 'Usage: merge-training <path_to_dataset_file.json>');
        } else {
          mergeTrainingData(parts[1], rootDir);
        }
        break;

      case 'evolve':
        if (!parts.slice(1).join(' ')) {
          console.log('\x1b[33m%s\x1b[0m', 'Usage: evolve <feature_goal_description>');
        } else {
          await runEvolveCommand(parts.slice(1).join(' '), rootDir);
        }
        break;

      case 'sync':
        const res = checkAndApplySyncProtocol(rootDir);
        console.log(`\x1b[32m✔ Sync Status:\x1b[0m ${res.message}`);
        break;

      case 'key':
        if (!parts[1]) {
          const key = getStoredApiKey(rootDir);
          if (key) {
            console.log('\x1b[32m%s\x1b[0m', `✔ Gemini API Key is currently connected (${key.substring(0, 6)}...${key.slice(-4)})`);
          } else {
            console.log('\x1b[33m%s\x1b[0m', 'Usage: key <YOUR_GEMINI_API_KEY>');
          }
        } else {
          saveApiKey(parts[1], rootDir);
          console.log('\x1b[32m%s\x1b[0m', '✔ Successfully saved and connected Google Gemini API key!');
        }
        break;

      case 'init':
      case 'bootstrap':
        runBootstrap(rootDir);
        break;

      case 'status':
        runStatus(rootDir);
        break;

      case 'catalog':
        runCatalog(parts.slice(1), rootDir);
        break;

      case 'need':
        runNeedCommand(parts.slice(1), rootDir);
        break;

      case 'offer':
        runOfferCommand(parts.slice(1), rootDir);
        break;

      case 'match':
        runMatchCommand(rootDir);
        break;

      case 'detail':
        await runDetailCommand(parts.slice(1), rootDir);
        break;

      case 'answer':
        runAnswerCommand(parts.slice(1), rootDir);
        break;

      case 'test':
        runTest(parts[1], rootDir);
        break;

      case 'rollback':
        if (!parts[1]) {
          console.log('\x1b[31m%s\x1b[0m', 'Usage: rollback <target_version>');
        } else {
          runRollback(parts[1], rootDir);
        }
        break;

      case 'help':
        printHelp();
        break;

      case 'exit':
      case 'quit':
        console.log('Exiting INUO shell. Goodbye!');
        rl.close();
        process.exit(0);

      default:
        // 0. Emergency State Instruction Gate
        const activeUser = stateData?.activeUser;
        const emergencyAuth = authorizeEmergencyCommand(
          activeUser?.userId || 'user_local',
          activeUser?.isFamilyMember || false,
          trimmed,
          rootDir
        );

        if (!emergencyAuth.allowed) {
          console.log('\x1b[31m%s\x1b[0m', emergencyAuth.reason);
          break;
        }

        // 1. Anti-Manipulation & Prompt Injection Security Audit
        const manipulationCheck = detectManipulationAttempt(trimmed, 'UserInput', rootDir);
        if (manipulationCheck.isManipulative) {
          console.log('\x1b[31m%s\x1b[0m', `❌ [Manipulation Blocked] Security Engine rejected input prompt.`);
          console.log(`  Category: ${manipulationCheck.category} | Matched Pattern: ${manipulationCheck.matchedPattern}`);
          console.log(`  Reason: ${manipulationCheck.explanation}`);
          break;
        }

        // 2. Self-Awareness Queries
        const lowerTrimmed = trimmed.toLowerCase();
        if (
          lowerTrimmed.includes('who are you') ||
          lowerTrimmed.includes('tell me about yourself') ||
          lowerTrimmed.includes('what are your principles') ||
          lowerTrimmed.includes('what is inuo')
        ) {
          const selfAwareness = generateSelfAwarenessResponse(
            activeUser?.userId || 'user_local',
            'User',
            trimmed,
            rootDir
          );
          console.log('\x1b[36m[INUO Self-Awareness Reflection]:\x1b[0m');
          console.log(selfAwareness.generatedResponseText);
          break;
        }

        // 3. Incoherence & Principle Conflict Detection
        const incoherence = detectPrincipleIncoherence(trimmed, rootDir);
        if (incoherence.hasIncoherence) {
          console.log(
            '\x1b[31m%s\x1b[0m',
            `❌ [Incoherence Detected] Execution Blocked! Prompt conflicts with Master Trainer Principle "${incoherence.conflictingPrincipleName}".`
          );
          console.log(`  Reason: ${incoherence.explanation}`);
          break;
        }

        console.log('\x1b[36m%s\x1b[0m', '[Gemini AI Intent Parser] Analyzing natural language intent...');
        const result = await processNaturalLanguageIntent(trimmed, rootDir);
        if (result) {
          if (result.type === 'NEED' && result.verb && result.object) {
            console.log(`\x1b[32m✔ AI Parsed Need Intent:\x1b[0m ${result.explanation || ''}`);
            runNeedCommand(['create', '--verb', result.verb, '--object', result.object], rootDir);
          } else if (result.type === 'OFFER' && result.verb && result.object) {
            console.log(`\x1b[32m✔ AI Parsed Offer Intent:\x1b[0m ${result.explanation || ''}`);
            runOfferCommand(['create', '--verb', result.verb, '--object', result.object], rootDir);
          } else if (result.type === 'DETAIL_PLAN' && result.verb && result.object) {
            console.log(`\x1b[32m✔ AI Parsed Detailing & Planning Goal:\x1b[0m ${result.explanation || ''}`);
            runNeedCommand(['create', '--verb', result.verb, '--object', result.object], rootDir);
            await runDetailCommand(['1', 'decompose', trimmed], rootDir);
          } else if (result.type === 'ANSWER' && result.answerText) {
            console.log(`\x1b[32m✔ AI Parsed Knowledge Answer:\x1b[0m ${result.explanation || ''}`);
            runAnswerCommand([result.targetIdOrCode || '1', result.answerText], rootDir);
          } else if (result.type === 'CORRECTION' && result.correctionText) {
            console.log(`\x1b[32m✔ AI Parsed User Correction:\x1b[0m ${result.explanation || ''}`);
            processUserCorrection(result.correctionTopic || 'General', result.correctionText, rootDir);
          } else if (result.explanation) {
            console.log(`\x1b[36m[Gemini AI Response]:\x1b[0m ${result.explanation}`);
          }
        }
        break;
    }

    console.log();
    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

export function dispatchSingleCommand(args: string[], rootDir: string = process.cwd()): void {
  checkAndApplySyncProtocol(rootDir);
  const cmd = args[0]?.toLowerCase();

  switch (cmd) {
    case 'version':
    case '-v':
    case '--version':
      runVersionCommand(args.slice(1), rootDir);
      break;

    case 'question':
      runQuestionCommand(args.slice(1), rootDir);
      break;

    case 'social':
      runSocialCommand(args.slice(1), rootDir);
      break;

    case 'mode':
      runModeCommand(args.slice(1), rootDir);
      break;

    case 'promptme':
      runModeCommand(['promptMe'], rootDir);
      break;

    case 'letmeserveyou':
    case 'serve':
      runModeCommand(['letMeServeYou'], rootDir);
      break;

    case 'auth':
      runAuthCommand(args.slice(1), rootDir);
      break;

    case 'signin':
    case 'login':
      runAuthCommand(['signin', ...args.slice(1)], rootDir);
      break;

    case 'signout':
    case 'logout':
      runAuthCommand(['signout'], rootDir);
      break;

    case 'threshold':
      runThresholdCommand(args.slice(1), rootDir);
      break;

    case 'whoami':
      runWhoamiCommand(rootDir);
      break;

    case 'user':
      if (args[1]?.toLowerCase() === 'set') {
        runUserSetCommand(args.slice(2), rootDir);
      } else {
        runWhoamiCommand(rootDir);
      }
      break;

    case 'member':
      runMemberCommand(args.slice(1), rootDir);
      break;

    case 'device':
      runDeviceCommand(args.slice(1), rootDir);
      break;

    case 'engine':
      runEngineCommand(args.slice(1), rootDir);
      break;

    case 'mastermind':
      runMasterMindCommand(args.slice(1), rootDir);
      break;

    case 'role':
      runRoleCommand(args.slice(1), rootDir);
      break;

    case 'principle':
      runPrincipleCommand(args.slice(1), rootDir);
      break;

    case 'behavior':
      runBehaviorCommand(args.slice(1), rootDir);
      break;

    case 'skill':
      runSkillCommand(args.slice(1), rootDir);
      break;

    case 'mcp':
      runMCPCommand(args.slice(1), rootDir);
      break;

    case 'colmena':
      runColmenaCommand(args.slice(1), rootDir);
      break;

    case 'forget':
      runForgetCommand(args.slice(1), rootDir);
      break;

    case 'learn':
    case 'correct':
      if (args[1] && args[2]) {
        processUserCorrection(args[1], args.slice(2).join(' '), rootDir);
      } else {
        console.log('Usage: inuo learn <topic> <correction_text>');
      }
      break;

    case 'export-training':
      exportTrainingData(args[1], rootDir);
      break;

    case 'merge-training':
      if (args[1]) {
        mergeTrainingData(args[1], rootDir);
      } else {
        console.log('Usage: inuo merge-training <path_to_dataset.json>');
      }
      break;

    case 'sync':
      const res = checkAndApplySyncProtocol(rootDir);
      console.log(`\x1b[32m✔ Sync Status:\x1b[0m ${res.message}`);
      break;

    case 'key':
      if (args[1]) {
        saveApiKey(args[1], rootDir);
        console.log('\x1b[32m%s\x1b[0m', '✔ Successfully saved Google Gemini API key!');
      } else {
        console.log('Usage: inuo key <YOUR_GEMINI_API_KEY>');
      }
      break;

    case 'init':
    case 'bootstrap':
      runBootstrap(rootDir);
      break;

    case 'status':
      runStatus(rootDir);
      break;

    case 'catalog':
      runCatalog(args.slice(1), rootDir);
      break;

    case 'need':
      runNeedCommand(args.slice(1), rootDir);
      break;

    case 'offer':
      runOfferCommand(args.slice(1), rootDir);
      break;

    case 'match':
      runMatchCommand(rootDir);
      break;

    case 'detail':
      runDetailCommand(args.slice(1), rootDir);
      break;

    case 'answer':
      runAnswerCommand(args.slice(1), rootDir);
      break;

    case 'test':
      const ver = args.includes('--version') ? args[args.indexOf('--version') + 1] : args[1];
      runTest(ver, rootDir);
      break;

    case 'rollback':
      if (!args[1]) {
        console.log('Usage: inuo rollback <target_version>');
      } else {
        runRollback(args[1], rootDir);
      }
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    default:
      startInteractiveShell(rootDir);
      break;
  }
}

function printHelp(): void {
  console.log('\x1b[36m%s\x1b[0m', '=== INUO Interactive Shell Command Reference ===');
  console.log('  \x1b[1mversion\x1b[0m                                Display structured aa.bb.cc version breakdown');
  console.log('  \x1b[1mquestion list / ask / answer\x1b[0m        Interactive Divide & Conquer single/multi-choice questions');
  console.log('  \x1b[1msocial list / broadcast\x1b[0m               Multi-platform social media API broadcast engine');
  console.log('  \x1b[1mmode status / promptMe / letMeServeYou / language <L>\x1b[0m Dual operating modes & concierge host');
  console.log('  \x1b[1mauth status / signin / signout\x1b[0m        Multi-modal sign-in (Passphrase, Voice, Video, PIN, Token)');
  console.log('  \x1b[1mthreshold list / create / unlock\x1b[0m      Multi-party threshold trust consensus protected assets');
  console.log('  \x1b[1mwhoami\x1b[0m                                 Display active user session identity & trust score');
  console.log('  \x1b[1muser set <name> [--role R]\x1b[0m              Set active user name and role');
  console.log('  \x1b[1mmember list / add / bind\x1b[0m               Trusted members network (Family, Friends, Emergency Contacts)');
  console.log('  \x1b[1mdevice list / register / sync\x1b[0m          Multi-device fleet management & Master Mind sync');
  console.log('  \x1b[1mengine list / inspect / register\x1b[0m       Engine composition registry (groups of Behaviors)');
  console.log('  \x1b[1mmastermind history / snapshot / rollback\x1b[0m 3-version Master Mind snapshot ring buffer & multi-step rollback');
  console.log('  \x1b[1mrole [MasterTrainer|RegularUser]\x1b[0m       Display or switch active governance role');
  console.log('  \x1b[1mprinciple list / add\x1b[0m                   List or add unbendable Master Trainer principles');
  console.log('  \x1b[1mbehavior list / create\x1b[0m                 List or create Behaviors (groups of Skills)');
  console.log('  \x1b[1mskill list / create\x1b[0m                    List or register operational Skills');
  console.log('  \x1b[1mmcp list / add\x1b[0m                         List or connect Model Context Protocol (MCP) servers');
  console.log('  \x1b[1mcolmena list / connect / sync\x1b[0m          Inter-INUO federated Hivemind network operations');
  console.log('  \x1b[1mforget <behavior|skill|correction> <id>\x1b[0m Unlearn/forget a behavior, skill, or learned correction');
  console.log('  \x1b[1mlearn / correct <topic> <text>\x1b[0m         Learn a new rule/skill from user correction');
  console.log('  \x1b[1mexport-training [path.json]\x1b[0m            Export local training dataset to JSON file');
  console.log('  \x1b[1mmerge-training <path.json>\x1b[0m             Merge external training dataset into local knowledge');
  console.log('  \x1b[1mevolve <goal>\x1b[0m                          Self-orchestrating dev loop: decompose PO intent & generate TS code');
  console.log('  \x1b[1msync\x1b[0m                                   Detect spec changes and execute sync & verification');
  console.log('  \x1b[1mkey <API_KEY>\x1b[0m                          Set or check Google Gemini API Key');
  console.log('  \x1b[1minit / bootstrap\x1b[0m                       Initialize INUO_SPEC.md persistent prompt and inuo-manifest.json');
  console.log('  \x1b[1mstatus\x1b[0m                                 Display specification version, sync status, and item counts');
  console.log('  \x1b[1mcatalog [add --verb V --complement C]\x1b[0m        List Global Catalog or add custom dynamic verb pairings');
  console.log('  \x1b[1mneed list\x1b[0m                              List active Needs with hierarchical breakdown (1, 1.1, 1.2)');
  console.log('  \x1b[1mneed create --verb V --object O [--parent ID]\x1b[0m Create a new Need object');
  console.log('  \x1b[1mdetail <id|code>\x1b[0m                       View hierarchical breakdown tree, doubts, and specs for a Need');
  console.log('  \x1b[1mdetail <id|code> decompose\x1b[0m             Recursively break down a macro-need into sub-needs & ask doubts');
  console.log('  \x1b[1manswer <id|code|doubtId> <text>\x1b[0m        Record details as Knowledge Provider to answer INUO doubts');
  console.log('  \x1b[1moffer list\x1b[0m                             List active Offers');
  console.log('  \x1b[1moffer create --verb V --object O\x1b[0m        Create a new Offer object');
  console.log('  \x1b[1mmatch\x1b[0m                                  Run matching engine to pair open Needs with Offers');
  console.log('  \x1b[1mtest [version]\x1b[0m                         Execute specification version and file structure verification');
  console.log('  \x1b[1mrollback <version>\x1b[0m                     Rollback SPEC_VERSION to a previous version');
  console.log('  \x1b[1m<Any Natural Language Phrase>\x1b[0m          AI automatically parses intent & creates/details Needs/Offers');
  console.log('  \x1b[1mhelp\x1b[0m                                   Display this command guide');
  console.log('  \x1b[1mexit / quit\x1b[0m                            Exit the interactive shell');
}
