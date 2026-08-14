import { getProjectPaths, loadState, saveState } from './context';
import { Principle } from '../interfaces/Principle';
import { Behavior } from '../interfaces/Behavior';
import { Skill } from '../interfaces/Skill';
import { UserRole } from '../types/UserRole';

export function runRoleCommand(args: string[], rootDir: string = process.cwd()): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const targetRole = args[0];

  if (!targetRole) {
    console.log(`\x1b[36mCurrent Operating Role:\x1b[0m \x1b[1m${state.currentRole || 'RegularUser'}\x1b[0m`);
    console.log('To switch roles, type: role MasterTrainer OR role RegularUser');
    return;
  }

  if (targetRole.toLowerCase() === 'mastertrainer' || targetRole.toLowerCase() === 'master') {
    state.currentRole = 'MasterTrainer';
    if (state.activeUser) state.activeUser.role = 'MasterTrainer';
    saveState(paths.statePath, state);
    console.log('\x1b[32m%s\x1b[0m', '✔ Switched operating role to: MasterTrainer (Master Governance Credentials Activated)');
    return;
  }

  if (targetRole.toLowerCase() === 'regularuser' || targetRole.toLowerCase() === 'user') {
    state.currentRole = 'RegularUser';
    if (state.activeUser) state.activeUser.role = 'RegularUser';
    saveState(paths.statePath, state);
    console.log('\x1b[36m%s\x1b[0m', '✔ Switched operating role to: RegularUser');
    return;
  }


  console.log('\x1b[33m%s\x1b[0m', 'Unknown role. Supported roles: "MasterTrainer", "RegularUser"');
}

export function runPrincipleCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Master Trainer Principles (Immutable & Unbendable Governance) ===\n');
    const principles = state.principles || [];
    if (principles.length === 0) {
      console.log('No governance principles defined.');
      return;
    }

    console.log(`\x1b[1m${'ID'.padEnd(28)} | ${'PRINCIPLE NAME'.padEnd(25)} | CREATOR & STATUS\x1b[0m`);
    console.log(''.padEnd(80, '-'));

    principles.forEach((p) => {
      console.log(`${p.id.padEnd(28)} | \x1b[32m${p.name.padEnd(25)}\x1b[0m | [${p.createdBy}] ${p.status}`);
      console.log(`  └─ Statement: "${p.statement}"\n`);
    });
    return;
  }

  if (sub === 'add') {
    if (state.currentRole !== 'MasterTrainer') {
      console.log(
        '\x1b[31m%s\x1b[0m',
        '❌ [Governance Authorization Denied] Principles can ONLY be added or modified by the Master Trainer. Regular users cannot bend or alter governance principles.'
      );
      console.log('Switch role using "role MasterTrainer" to perform governance updates.');
      return;
    }

    let name = '';
    let statement = '';

    for (let i = 1; i < args.length; i++) {
      if ((args[i] === '--name' || args[i] === '-n') && args[i + 1]) name = args[i + 1];
      if ((args[i] === '--statement' || args[i] === '-s') && args[i + 1]) statement = args[i + 1];
    }

    if (!name || !statement) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: principle add --name <PrincipleName> --statement <DirectiveStatement>');
      return;
    }

    const newPrinciple: Principle = {
      id: `principle_${Date.now()}`,
      name,
      statement,
      createdBy: 'MasterTrainer',
      isImmutable: true,
      status: 'Locked',
      createdAt: new Date().toISOString(),
    };

    if (!state.principles) state.principles = [];
    state.principles.push(newPrinciple);
    saveState(paths.statePath, state);

    console.log('\x1b[32m%s\x1b[0m', `✔ Added Master Trainer Principle: "${newPrinciple.name}" [ID: ${newPrinciple.id}] (Status: Locked/Immutable)`);
    return;
  }

  console.log('Unknown subcommand for principle. Supported: "principle list", "principle add --name <Name> --statement <Statement>"');
}

export function runSkillCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Registered Operational Skills ===\n');
    const skills = state.skills || [];
    skills.forEach((s) => {
      console.log(`[${s.id}] \x1b[1m${s.name}\x1b[0m | Category: ${s.verbCategory || 'General'}`);
      console.log(`  └─ ${s.description}`);
    });
    return;
  }

  if (sub === 'create' || sub === 'add') {
    let name = '';
    let description = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
      if (args[i] === '--description' && args[i + 1]) description = args[i + 1];
    }

    if (!name) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: skill create --name <SkillName> --description <Description>');
      return;
    }

    const skill: Skill = {
      id: `skill_${Date.now()}`,
      name,
      description: description || 'Custom operational skill',
      createdAt: new Date().toISOString(),
    };

    if (!state.skills) state.skills = [];
    state.skills.push(skill);
    saveState(paths.statePath, state);

    console.log('\x1b[32m%s\x1b[0m', `✔ Registered Operational Skill: "${skill.name}" [ID: ${skill.id}]`);
    return;
  }
}

export function runBehaviorCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Configured Behaviors (Groups of Skills) ===\n');
    const behaviors = state.behaviors || [];
    const skills = state.skills || [];

    behaviors.forEach((b) => {
      const activeStr = b.isActive ? '\x1b[32m[Active]\x1b[0m' : '\x1b[33m[Inactive]\x1b[0m';
      const skillNames = b.skillIds
        .map((sId) => {
          const found = skills.find((sk) => sk.id === sId || sk.name === sId);
          return found ? found.name : sId;
        })
        .join(', ');

      console.log(`[${b.id}] \x1b[1m${b.name}\x1b[0m ${activeStr}`);
      console.log(`  Description: ${b.description}`);
      console.log(`  Skills Grouped: { ${skillNames} }\n`);
    });
    return;
  }

  if (sub === 'create' || sub === 'add') {
    let name = '';
    let skillsInput = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
      if (args[i] === '--skills' && args[i + 1]) skillsInput = args[i + 1];
    }

    if (!name || !skillsInput) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: behavior create --name <BehaviorName> --skills <Skill1,Skill2>');
      return;
    }

    const skillIds = skillsInput.split(',').map((s) => s.trim());

    const newBehavior: Behavior = {
      id: `behavior_${Date.now()}`,
      name,
      description: `Grouped operational behavior comprising skills: ${skillIds.join(', ')}`,
      skillIds,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (!state.behaviors) state.behaviors = [];
    state.behaviors.push(newBehavior);
    saveState(paths.statePath, state);

    console.log(
      '\x1b[32m%s\x1b[0m',
      `✔ Grouped Skills into Behavior: "${newBehavior.name}" [Skills: ${skillIds.join(', ')}] [ID: ${newBehavior.id}]`
    );
    return;
  }

  console.log('Unknown subcommand for behavior. Supported: "behavior list", "behavior create --name <Name> --skills <S1,S2>"');
}
