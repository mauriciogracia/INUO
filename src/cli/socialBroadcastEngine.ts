import { getProjectPaths, loadState } from './context';
import { SocialBroadcastPayload } from '../interfaces/SocialBroadcastPayload';
import { detectManipulationAttempt } from './manipulationDefenseEngine';
import { detectPrincipleIncoherence } from './incoherenceEngine';

export function broadcastMultiPlatform(
  message: string,
  targetPlatforms: string[] = ['twitter', 'linkedin', 'facebook', 'telegram'],
  rootDir: string = process.cwd()
): SocialBroadcastPayload {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const user = state.activeUser || { userId: 'user_local', userName: 'Default User', role: 'RegularUser', authenticatedAt: new Date().toISOString() };

  // 1. Anti-Manipulation & Prompt Injection Security Audit
  const check = detectManipulationAttempt(message, 'UserInput', rootDir);
  if (check.isManipulative) {
    console.log('\x1b[31m%s\x1b[0m', `❌ [Social Broadcast Blocked] Security Engine rejected broadcast message.`);
    return {
      broadcastId: `bcast_blocked_${Date.now()}`,
      message,
      targetPlatforms,
      dispatchedByUserId: user.userId,
      results: targetPlatforms.reduce((acc, p) => ({ ...acc, [p]: false }), {}),
      dispatchedAt: new Date().toISOString(),
    };
  }

  // 2. Principle Incoherence Check
  const incoherence = detectPrincipleIncoherence(message, rootDir);
  if (incoherence.hasIncoherence) {
    console.log('\x1b[31m%s\x1b[0m', `❌ [Incoherence Blocked] Broadcast prompt conflicts with Master Trainer Principle "${incoherence.conflictingPrincipleName}".`);
    return {
      broadcastId: `bcast_incoherent_${Date.now()}`,
      message,
      targetPlatforms,
      dispatchedByUserId: user.userId,
      results: targetPlatforms.reduce((acc, p) => ({ ...acc, [p]: false }), {}),
      dispatchedAt: new Date().toISOString(),
    };
  }

  // 3. Multi-Platform API Dispatcher (Simulated API Integrations)
  const results: Record<string, boolean> = {};

  console.log('\x1b[36m%s\x1b[0m', '=== Multi-Platform Social Broadcast Engine Dispatching API Calls ===\n');

  for (const platform of targetPlatforms) {
    const norm = platform.toLowerCase().trim();
    switch (norm) {
      case 'twitter':
      case 'x':
        console.log(`  \x1b[32m✔ [X / Twitter API Integration]\x1b[0m Dispatched tweet: "${message.substring(0, 50)}..."`);
        results['twitter'] = true;
        break;

      case 'linkedin':
        console.log(`  \x1b[32m✔ [LinkedIn OAuth API Integration]\x1b[0m Published professional update.`);
        results['linkedin'] = true;
        break;

      case 'facebook':
      case 'meta':
        console.log(`  \x1b[32m✔ [Facebook Graph API Integration]\x1b[0m Posted to Page Feed.`);
        results['facebook'] = true;
        break;

      case 'telegram':
        console.log(`  \x1b[32m✔ [Telegram Bot API Integration]\x1b[0m Sent message to Telegram Channel.`);
        results['telegram'] = true;
        break;

      default:
        console.log(`  \x1b[33m⚠ [Custom API Integration: ${platform}]\x1b[0m Dispatched web hook payload.`);
        results[platform] = true;
        break;
    }
  }

  const broadcastId = `bcast_${Date.now()}`;
  console.log(`\n\x1b[32m✔ [Multi-Platform Broadcast Engine]\x1b[0m Broadcast complete [ID: ${broadcastId}] across ${Object.keys(results).length} platform API(s).`);

  return {
    broadcastId,
    message,
    targetPlatforms,
    dispatchedByUserId: user.userId,
    results,
    dispatchedAt: new Date().toISOString(),
  };
}
