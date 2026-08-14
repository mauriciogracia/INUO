import { getProjectPaths, loadState } from './context';
import { setOperatingMode, setInteractionLanguage, setSuccinctMode, initiateHostGreeting } from './hostServiceEngine';

export function runModeCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'status';

  if (sub === 'status') {
    console.log('\x1b[36m%s\x1b[0m', '=== INUO Operating Mode & Language Concierge Status ===\n');
    const paths = getProjectPaths(rootDir);
    const state = loadState(paths.statePath);
    const modeConfig = state.operatingMode || {
      currentMode: 'promptMe',
      detectedLanguage: 'en',
      autoDetectLanguage: true,
      authRequiredOnStart: false,
      isSuccinctMode: false,
      updatedAt: new Date().toISOString(),
    };

    const host = initiateHostGreeting(rootDir);

    console.log(`Operating Mode:    \x1b[1m\x1b[33m${modeConfig.currentMode}\x1b[0m`);
    console.log(`Language:          \x1b[32m${modeConfig.detectedLanguage.toUpperCase()}\x1b[0m (Auto-Detect: ${modeConfig.autoDetectLanguage ? 'Enabled' : 'Disabled'})`);
    console.log(`Succinct Mode:     ${modeConfig.isSuccinctMode ? '\x1b[32mENABLED (Bullet lists only, no tables)\x1b[0m' : '\x1b[33mDISABLED (Standard)\x1b[0m'}`);
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

  if (sub === 'language' || sub === 'lang') {
    const lang = args[1]?.toLowerCase();
    if (!lang) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: mode language <en|es|fr|de|pt>');
      return;
    }

    setInteractionLanguage(lang, false, rootDir);
    return;
  }

  console.log('Unknown subcommand for mode. Supported: "mode status", "mode promptMe", "mode letMeServeYou", "mode succinct [on|off]", "mode language <en|es|fr|de|pt>"');
}
