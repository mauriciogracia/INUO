import { getProjectPaths, loadState } from './context';
import { setOperatingMode, setInteractionLanguage, setSuccinctMode, setDebugLevel, initiateHostGreeting } from './hostServiceEngine';

export function runModeCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'status';

  if (sub === 'status') {
    console.log('\x1b[36m%s\x1b[0m', '=== INUO Operating Mode & System Config Status ===\n');
    const paths = getProjectPaths(rootDir);
    const state = loadState(paths.statePath);
    const modeConfig = state.operatingMode || {
      currentMode: 'promptMe',
      detectedLanguage: 'en',
      autoDetectLanguage: true,
      authRequiredOnStart: false,
      isSuccinctMode: true,
      debugLevel: 1,
      updatedAt: new Date().toISOString(),
    };

    const host = initiateHostGreeting(rootDir);
    const levelNames = ['OFF (0)', 'INFO (1) [Default]', 'DEBUG (2)', 'TRACE (3)'];
    const currentDebug = modeConfig.debugLevel !== undefined ? modeConfig.debugLevel : 1;

    console.log(`Operating Mode:    \x1b[1m\x1b[33m${modeConfig.currentMode}\x1b[0m`);
    console.log(`Language:          \x1b[32m${modeConfig.detectedLanguage.toUpperCase()}\x1b[0m (Auto-Detect: ${modeConfig.autoDetectLanguage ? 'Enabled' : 'Disabled'})`);
    console.log(`Succinct Mode:     ${modeConfig.isSuccinctMode !== false ? '\x1b[32mENABLED (Bullet lists only, no tables)\x1b[0m' : '\x1b[33mDISABLED (Standard)\x1b[0m'}`);
    console.log(`Debug Level:       \x1b[35mLevel ${currentDebug} - ${levelNames[currentDebug] || currentDebug}\x1b[0m`);
    console.log(`Auth Gating:       ${host.authRequired ? '\x1b[31mAuthentication Required\x1b[0m' : '\x1b[32mAuthenticated / Standard\x1b[0m'}`);
    console.log(`\n\x1b[36m[Host Concierge Greeting]:\x1b[0m`);
    console.log(`  "${host.greeting}"`);
    console.log(`  "${host.promptMessage}"`);
    return;
  }

  if (sub === 'promptme') {
    setOperatingMode('promptMe', rootDir);
    return;
  }

  if (sub === 'letmeserveyou' || sub === 'serve' || sub === 'host') {
    setOperatingMode('letMeServeYou', rootDir);
    const host = initiateHostGreeting(rootDir);
    console.log(`\x1b[36m[Host Greeting]:\x1b[0m ${host.greeting}`);
    console.log(`\x1b[33m[Host Prompt]:\x1b[0m ${host.promptMessage}`);
    return;
  }

  if (sub === 'succinct' || sub === 'succinctmode') {
    const flag = args[1]?.toLowerCase();
    if (flag === 'off' || flag === 'false' || flag === 'disable') {
      setSuccinctMode(false, rootDir);
    } else {
      setSuccinctMode(true, rootDir);
    }
    return;
  }

  if (sub === 'debug' || sub === 'debuglevel' || sub === 'loglevel') {
    const levelStr = args[1];
    if (levelStr === undefined) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: mode debug <0|1|2|3>');
      console.log('  0 = OFF, 1 = INFO [Default], 2 = DEBUG, 3 = TRACE');
      return;
    }
    const val = parseInt(levelStr, 10);
    if (isNaN(val) || val < 0 || val > 3) {
      console.log('\x1b[31m%s\x1b[0m', 'Invalid debug level. Choose between 0 (OFF), 1 (INFO), 2 (DEBUG), or 3 (TRACE).');
      return;
    }
    setDebugLevel(val, rootDir);
    return;
  }

  if (sub === 'language' || sub === 'lang') {
    const lang = args[1]?.toLowerCase();
    if (!lang) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: mode language <en|es|fr|de|pt>');
      return;
    }

    setInteractionLanguage(lang, false, rootDir);
    return;
  }

  console.log('Unknown subcommand for mode. Supported: "mode status", "mode promptMe", "mode letMeServeYou", "mode succinct [on|off]", "mode debug <0|1|2|3>", "mode language <en|es|fr|de|pt>"');
}
