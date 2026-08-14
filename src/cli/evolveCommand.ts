import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { loadEnvironment } from './environment';
import { runNeedCommand } from './needCommand';
import { runTest } from './testCommand';
import { loadManifest } from './context';

function bumpSemver(versionStr: string): string {
  const parts = versionStr.split('.').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    parts[2] += 1;
    return parts.join('.');
  }
  return '0.1.1';
}

export async function runEvolveCommand(goalInput: string, rootDir: string = process.cwd()): Promise<void> {
  console.log('\x1b[36m%s\x1b[0m', '=== INUO-on-INUO Self-Orchestrating Dev Lifecycle ===');
  console.log(`\x1b[1mPO Intent (The Need):\x1b[0m "${goalInput}"\n`);

  const env = loadEnvironment(rootDir);

  if (!env.geminiApiKey) {
    console.log('\x1b[33m%s\x1b[0m', '[INUO Self-Evolution] Gemini API Key is required to evolve INUO.');
    console.log('Connect your key by typing: \x1b[1mkey <YOUR_GEMINI_API_KEY>\x1b[0m\n');
    return;
  }

  const manifestPath = path.join(rootDir, 'inuo-manifest.json');
  const specPath = path.join(rootDir, 'INUO_SPEC.md');

  const manifestBackup = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : null;
  const specBackup = fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf8') : null;

  try {
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const prompt = `You are the INUO-on-INUO Self-Orchestration Architect.
The Product Owner has given the following feature goal: "${goalInput}"

Your task is to evolve the INUO codebase AND specification following DEV_RULES.md:
1. Decompose the goal into Atomic Needs: NEED = (VERB) + (OBJECT).
2. Every type, enum, and interface MUST be in its own single-definition file under src/interfaces/, src/types/, or src/enums/.
3. Write a markdown specification snippet describing this new feature to be appended to INUO_SPEC.md.

Return ONLY a raw JSON object with NO markdown formatting matching this structure:
{
  "summary": "High-level evolution description",
  "specSnippet": "### Feature Specification Title\\nMarkdown documentation of new spec...",
  "atomicNeeds": [
    { "verb": "VerbName", "object": "ObjectName" }
  ],
  "newInterfaces": [
    {
      "filename": "InterfaceName.ts",
      "content": "export interface InterfaceName { ... }"
    }
  ],
  "newTypes": [
    {
      "filename": "TypeName.ts",
      "content": "export type TypeName = ...;"
    }
  ]
}`;

    console.log('\x1b[36m%s\x1b[0m', '[Semantic Decomposition] LLM Architect analyzing intent & catalog...');
    const response = await ai.models.generateContent({
      model: env.defaultModel,
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const plan = JSON.parse(cleanJson);

    console.log(`\x1b[32m✔ Evolution Plan Generated:\x1b[0m ${plan.summary}\n`);

    if (Array.isArray(plan.atomicNeeds)) {
      for (const n of plan.atomicNeeds) {
        runNeedCommand(['create', '--verb', n.verb || 'Request', '--object', n.object || goalInput], rootDir);
      }
    }

    const createdFiles: string[] = [];

    if (Array.isArray(plan.newInterfaces)) {
      for (const item of plan.newInterfaces) {
        const filePath = path.join(rootDir, 'src', 'interfaces', item.filename);
        fs.writeFileSync(filePath, item.content, 'utf8');
        createdFiles.push(filePath);

        const indexPath = path.join(rootDir, 'src', 'interfaces', 'index.ts');
        const exportName = item.filename.replace('.ts', '');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        if (!indexContent.includes(`./${exportName}`)) {
          fs.appendFileSync(indexPath, `export * from './${exportName}';\n`, 'utf8');
        }
        console.log('\x1b[32m%s\x1b[0m', `✔ Generated Interface: src/interfaces/${item.filename}`);
      }
    }

    if (Array.isArray(plan.newTypes)) {
      for (const item of plan.newTypes) {
        const filePath = path.join(rootDir, 'src', 'types', item.filename);
        fs.writeFileSync(filePath, item.content, 'utf8');
        createdFiles.push(filePath);

        const indexPath = path.join(rootDir, 'src', 'types', 'index.ts');
        const exportName = item.filename.replace('.ts', '');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        if (!indexContent.includes(`./${exportName}`)) {
          fs.appendFileSync(indexPath, `export * from './${exportName}';\n`, 'utf8');
        }
        console.log('\x1b[32m%s\x1b[0m', `✔ Generated Type Alias: src/types/${item.filename}`);
      }
    }

    console.log('\n\x1b[36m%s\x1b[0m', '[Verification] Verifying generated evolution code...');
    try {
      runTest(undefined, rootDir);
    } catch (testErr: any) {
      console.log('\x1b[31m%s\x1b[0m', `[Verification Failed] ${testErr.message}. Initiating Automated Rollback...`);
      if (manifestBackup) fs.writeFileSync(manifestPath, manifestBackup, 'utf8');
      if (specBackup) fs.writeFileSync(specPath, specBackup, 'utf8');
      for (const f of createdFiles) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
      console.log('\x1b[33m%s\x1b[0m', '✔ Automated Rollback Complete! Restored state to previous working version.');
      return;
    }

    const manifest = loadManifest(manifestPath);

    if (manifest) {
      const oldSpecVersion = manifest.SPEC_VERSION || '0.1.0';
      const newSpecVersion = bumpSemver(oldSpecVersion);

      manifest.SPEC_VERSION = newSpecVersion;
      manifest.lastSyncedAt = new Date().toISOString();
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

      if (plan.specSnippet && fs.existsSync(specPath)) {
        let specContent = fs.readFileSync(specPath, 'utf8');
        specContent = specContent.replace(/SPEC_VERSION:\s*["']?[0-9]+\.[0-9]+\.[0-9]+["']?/i, `SPEC_VERSION: "${newSpecVersion}"`);
        specContent += `\n\n## Evolved Spec (${newSpecVersion}): ${goalInput}\n${plan.specSnippet}\n`;
        fs.writeFileSync(specPath, specContent, 'utf8');
      }

      console.log('\x1b[32m%s\x1b[0m', `✔ [Spec Evolution] Updated INUO_SPEC.md & bumped SPEC_VERSION: "${oldSpecVersion}" -> "${newSpecVersion}"`);
    }

    console.log('\x1b[33m%s\x1b[0m', '\n★ INUO-on-INUO Self-Evolution Complete! Specification & Codebase synchronized.');
  } catch (err: any) {
    console.log('\x1b[31m%s\x1b[0m', `[Self-Evolution Error] ${err.message}`);
  }
}
