import { getProjectPaths, loadState } from './context';
import { addTrustedMember, bindDeviceToMember } from './trustedMemberEngine';
import { RelationshipType } from '../types/RelationshipType';

export function runMemberCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', `=== Master Mind Trusted Members Network (Family & Friends) ===\n`);
    const members = state.trustedMembers || [];

    if (members.length === 0) {
      console.log('No trusted members registered yet. Register one using "member add --name <Name> --relation <Family|TrustedFriend|EmergencyContact>"');
      return;
    }

    console.log(`\x1b[1m${'MEMBER ID'.padEnd(25)} | ${'NAME'.padEnd(20)} | RELATION | TRUST SCORE | BOUND DEVICES\x1b[0m`);
    console.log(''.padEnd(95, '-'));

    members.forEach((m) => {
      const devStr = m.trustedDeviceIds.length > 0 ? m.trustedDeviceIds.join(', ') : 'None';
      console.log(
        `${m.memberId.padEnd(25)} | \x1b[1m${m.memberName.padEnd(20)}\x1b[0m | ${m.relationshipType.padEnd(12)} | \x1b[33m${m.trustScore}/100\x1b[0m | ${devStr}`
      );
    });
    return;
  }

  if (sub === 'add' || sub === 'register') {
    let name = '';
    let relationInput: RelationshipType = 'Family';
    let devicesInput = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
      if (args[i] === '--relation' && args[i + 1]) {
        const r = args[i + 1].toLowerCase();
        if (r === 'family' || r === 'kid' || r === 'spouse') relationInput = 'Family';
        if (r === 'trustedfriend' || r === 'friend') relationInput = 'TrustedFriend';
        if (r === 'emergencycontact' || r === 'contact') relationInput = 'EmergencyContact';
        if (r === 'mastertrainer' || r === 'master') relationInput = 'MasterTrainer';
      }
      if (args[i] === '--devices' && args[i + 1]) devicesInput = args[i + 1];
    }

    if (!name && args[1] && !args[1].startsWith('-')) name = args[1];

    if (!name) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: member add --name <Name> [--relation Family|TrustedFriend|EmergencyContact] [--devices D1,D2]');
      return;
    }

    const deviceIds = devicesInput ? devicesInput.split(',').map((d) => d.trim()) : [];
    const member = addTrustedMember(name, relationInput, deviceIds, rootDir);

    console.log(
      '\x1b[32m%s\x1b[0m',
      `✔ Registered Trusted Member: "${member.memberName}" [Relation: ${member.relationshipType}, ID: ${member.memberId}]`
    );
    return;
  }

  if (sub === 'bind') {
    let memberQuery = '';
    let deviceId = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--member' && args[i + 1]) memberQuery = args[i + 1];
      if (args[i] === '--device' && args[i + 1]) deviceId = args[i + 1];
    }

    if (!memberQuery && args[1]) memberQuery = args[1];
    if (!deviceId && args[2]) deviceId = args[2];

    if (!memberQuery || !deviceId) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: member bind --member <MemberNameOrId> --device <DeviceId>');
      return;
    }

    bindDeviceToMember(memberQuery, deviceId, rootDir);
    return;
  }

  console.log('Unknown subcommand for member. Supported: "member list", "member add --name <N> --relation <R>", "member bind --member <M> --device <D>"');
}
