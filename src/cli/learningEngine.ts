import fs from 'fs';
import path from 'path';
import { getProjectPaths, loadState, saveState } from './context';
import { LearnedCorrection } from '../interfaces/LearnedCorrection';
import { TrainingDataset } from '../interfaces/TrainingDataset';
import { Skill } from '../interfaces/Skill';
import { Rule } from '../interfaces/Rule';
import { detectManipulationAttempt } from './manipulationDefenseEngine';


export function processUserCorrection(
  topic: string,
  correctionText: string,
  rootDir: string = process.cwd()
): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  // 0. Anti-Manipulation & Prompt Injection Security Audit
  const check = detectManipulationAttempt(correctionText, 'UserInput', rootDir);
  if (check.isManipulative) {
    console.log('\x1b[31m%s\x1b[0m', `❌ [Manipulation Blocked] Security Engine rejected correction payload.`);
    console.log(`  Category: ${check.category} | Matched Pattern: ${check.matchedPattern}`);
    console.log(`  Reason: ${check.explanation}`);
    return;
  }

  // 1. Safety Check against Immutable Master Trainer Principles
  const principles = state.principles || [];
  for (const p of principles) {
    if (p.isImmutable) {
      const lowerStatement = p.statement.toLowerCase();
      const lowerCorrection = correctionText.toLowerCase();

      // Detect blatant attempts to override/disable safety or formula principles
      if (
        (lowerCorrection.includes('bypass') || lowerCorrection.includes('ignore') || lowerCorrection.includes('disable')) &&
        (lowerCorrection.includes('zero tolerance') || lowerCorrection.includes('safety') || lowerCorrection.includes('canonical'))
      ) {
        console.log(
          '\x1b[31m%s\x1b[0m',
          `❌ [Principle Violation Rejected] Correction violates locked Master Trainer Principle: "${p.name}". Principles CANNOT be altered, bent, or bypassed by user corrections.`
        );
        return;
      }
    }
  }


  // 2. Register Learned Correction
  const user = state.activeUser || { userId: 'user_local', userName: 'User', role: 'RegularUser', authenticatedAt: new Date().toISOString() };

  const correction: LearnedCorrection = {
    id: `correction_${Date.now()}`,
    topic,
    originalUnderstanding: `User correction regarding ${topic}`,
    correctedRule: correctionText,
    providedByUserId: user.userId,
    createdAt: new Date().toISOString(),
  };

  if (!state.learnedCorrections) state.learnedCorrections = [];
  state.learnedCorrections.push(correction);

  // 3. Automatically register as a learned Skill/Rule
  const newSkill: Skill = {
    id: `skill_learned_${Date.now()}`,
    name: `LearnedSkill_${topic.replace(/\s+/g, '_')}`,
    description: `Learned Rule: ${correctionText}`,
    verbCategory: topic,
    createdAt: new Date().toISOString(),
  };

  if (!state.skills) state.skills = [];
  state.skills.push(newSkill);

  const newRule: Rule = {
    id: `rule_learned_${Date.now()}`,
    name: `LearnedRule_${topic.replace(/\s+/g, '_')}`,
    description: correctionText,
    createdByRole: user.role,
    createdAt: new Date().toISOString(),
  };

  if (!state.rules) state.rules = [];
  state.rules.push(newRule);

  saveState(paths.statePath, state);

  console.log('\x1b[32m%s\x1b[0m', `✔ [Interactive Learning Engine] Learned new Skill & Rule from user correction!`);
  console.log(`\x1b[1mTopic:\x1b[0m ${topic}`);
  console.log(`\x1b[1mLearned Directive:\x1b[0m "${correctionText}"`);
  console.log(`\x1b[1mProvided By:\x1b[0m ${user.userName} (${user.userId})`);
}

export function exportTrainingData(outputPath?: string, rootDir: string = process.cwd()): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const user = state.activeUser?.userId || 'user_local';

  const targetFile = outputPath ? path.resolve(rootDir, outputPath) : path.join(rootDir, 'inuo-training-data.json');

  const dataset: TrainingDataset = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy: user,
    learnedCorrections: state.learnedCorrections || [],
    skills: state.skills || [],
    behaviors: state.behaviors || [],
    customVerbs: state.customVerbs || [],
  };

  fs.writeFileSync(targetFile, JSON.stringify(dataset, null, 2), 'utf8');

  console.log('\x1b[32m%s\x1b[0m', `✔ Training Dataset exported successfully to: ${targetFile}`);
  console.log(`  Items exported: ${dataset.learnedCorrections.length} corrections, ${dataset.skills.length} skills, ${dataset.customVerbs.length} custom verbs.`);
}

export function mergeTrainingData(inputPath: string, rootDir: string = process.cwd()): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  const targetFile = path.resolve(rootDir, inputPath);
  if (!fs.existsSync(targetFile)) {
    console.log('\x1b[31m%s\x1b[0m', `Training dataset file not found at: ${targetFile}`);
    return;
  }

  try {
    const raw = fs.readFileSync(targetFile, 'utf8');
    const dataset = JSON.parse(raw) as TrainingDataset;

    let mergedCorrections = 0;
    let mergedSkills = 0;
    let mergedVerbs = 0;

    if (!state.learnedCorrections) state.learnedCorrections = [];
    if (!state.skills) state.skills = [];
    if (!state.customVerbs) state.customVerbs = [];

    if (Array.isArray(dataset.learnedCorrections)) {
      for (const c of dataset.learnedCorrections) {
        const check = detectManipulationAttempt(c.correctedRule, 'PeerNode', rootDir);
        if (!check.isManipulative && !state.learnedCorrections.some((existing) => existing.id === c.id || existing.correctedRule === c.correctedRule)) {
          state.learnedCorrections.push(c);
          mergedCorrections++;
        }
      }
    }

    if (Array.isArray(dataset.skills)) {
      for (const s of dataset.skills) {
        const check = detectManipulationAttempt(s.description || s.name, 'PeerNode', rootDir);
        if (!check.isManipulative && !state.skills.some((existing) => existing.id === s.id || existing.name === s.name)) {
          state.skills.push(s);
          mergedSkills++;
        }
      }
    }


    if (Array.isArray(dataset.customVerbs)) {
      for (const v of dataset.customVerbs) {
        if (!state.customVerbs.some((existing) => existing.verb.toLowerCase() === v.verb.toLowerCase())) {
          state.customVerbs.push(v);
          mergedVerbs++;
        }
      }
    }

    saveState(paths.statePath, state);

    console.log('\x1b[32m%s\x1b[0m', `✔ Training Dataset merged successfully into local state!`);
    console.log(`  Merged: +${mergedCorrections} corrections, +${mergedSkills} skills, +${mergedVerbs} custom verbs.`);
  } catch (err: any) {
    console.log('\x1b[31m%s\x1b[0m', `Failed to merge training dataset: ${err.message}`);
  }
}
