import { broadcastMultiPlatform } from './socialBroadcastEngine';

export function runSocialCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'list';

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== INUO Multi-Platform Social Broadcast Engine Integration ===\n');
    console.log(`Registered API Integrations:`);
    console.log(`  1. \x1b[1mX / Twitter API\x1b[0m       (Behavior: behavior_post_twitter)`);
    console.log(`  2. \x1b[1mLinkedIn OAuth API\x1b[0m    (Behavior: behavior_post_linkedin)`);
    console.log(`  3. \x1b[1mFacebook Graph API\x1b[0m    (Behavior: behavior_post_facebook)`);
    console.log(`  4. \x1b[1mTelegram Bot API\x1b[0m      (Behavior: behavior_post_telegram)`);
    console.log(`\nUsage: social broadcast --message <Msg> [--platforms twitter,linkedin,facebook,telegram]`);
    return;
  }

  if (sub === 'broadcast' || sub === 'post') {
    let message = '';
    let platformsInput = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--message' && args[i + 1]) message = args[i + 1];
      if (args[i] === '--platforms' && args[i + 1]) platformsInput = args[i + 1];
    }

    if (!message && args[1] && !args[1].startsWith('-')) message = args[1];

    if (!message) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: social broadcast --message <MessageText> [--platforms twitter,linkedin,facebook,telegram]');
      return;
    }

    const targetPlatforms = platformsInput ? platformsInput.split(',').map((p) => p.trim()) : ['twitter', 'linkedin', 'facebook', 'telegram'];
    broadcastMultiPlatform(message, targetPlatforms, rootDir);
    return;
  }

  console.log('Unknown subcommand for social. Supported: "social list", "social broadcast --message <Msg>"');
}
