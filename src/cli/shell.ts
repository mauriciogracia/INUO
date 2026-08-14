import readline from 'readline';
import { createContext } from './context';
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


export function startInteractiveShell(rootDir: string = process.cwd()): void {
  const syncRes = checkAndApplySyncProtocol(rootDir);
  const ctx = createContext(rootDir);
  const version = ctx.manifest?.SPEC_VERSION || '0.1.0';
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

  const commands = ['evolve', 'sync', 'key', 'init', 'bootstrap', 'status', 'catalog', 'need', 'offer', 'match', 'test', 'rollback', 'help', 'exit', 'quit'];


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

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
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
        runCatalog();
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
        console.log('\x1b[36m%s\x1b[0m', '[Gemini AI Intent Parser] Analyzing natural language intent...');
        const result = await processNaturalLanguageIntent(trimmed, rootDir);
        if (result) {
          if (result.type === 'NEED' && result.verb && result.object) {
            console.log(`\x1b[32m✔ AI Parsed Need Intent:\x1b[0m ${result.explanation || ''}`);
            runNeedCommand(['create', '--verb', result.verb, '--object', result.object], rootDir);
          } else if (result.type === 'OFFER' && result.verb && result.object) {
            console.log(`\x1b[32m✔ AI Parsed Offer Intent:\x1b[0m ${result.explanation || ''}`);
            runOfferCommand(['create', '--verb', result.verb, '--object', result.object], rootDir);
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
      runCatalog();
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
  console.log('  \x1b[1mevolve <goal>\x1b[0m                   Self-orchestrating dev loop: decompose PO intent & generate TS code');
  console.log('  \x1b[1msync\x1b[0m                            Detect spec changes and execute sync & verification');

  console.log('  \x1b[1mkey <API_KEY>\x1b[0m                   Set or check Google Gemini API Key');
  console.log('  \x1b[1minit / bootstrap\x1b[0m                Initialize INUO_SPEC.md persistent prompt and inuo-manifest.json');
  console.log('  \x1b[1mstatus\x1b[0m                          Display specification version, sync status, and item counts');
  console.log('  \x1b[1mcatalog\x1b[0m                         List Global Catalog of Verbs and Complement pairings');
  console.log('  \x1b[1mneed list\x1b[0m                       List active Needs');
  console.log('  \x1b[1mneed create --verb V --object O\x1b[0m Create a new Need object');
  console.log('  \x1b[1moffer list\x1b[0m                      List active Offers');
  console.log('  \x1b[1moffer create --verb V --object O\x1b[0m Create a new Offer object');
  console.log('  \x1b[1mmatch\x1b[0m                           Run matching engine to pair open Needs with Offers');
  console.log('  \x1b[1mtest [version]\x1b[0m                  Execute specification version and file structure verification');
  console.log('  \x1b[1mrollback <version>\x1b[0m              Rollback SPEC_VERSION to a previous version');
  console.log('  \x1b[1m<Any Natural Language Phrase>\x1b[0m   AI automatically parses intent & creates Need/Offer');
  console.log('  \x1b[1mhelp\x1b[0m                            Display this command guide');
  console.log('  \x1b[1mexit / quit\x1b[0m                     Exit the interactive shell');
}
