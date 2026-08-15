# Adaptive User Format Preference Learning

## Problem

Users currently have to repeat formatting instructions every session:
"make it shorter", "use bullet lists", "avoid tables".
These preferences are not remembered, so the same correction is needed conversation after conversation.

## Solution

The **Preference Engine** (`src/cli/preferenceEngine.ts`) detects formatting intent signals inline,
persists them per user, injects them into every subsequent LLM prompt,
and exports them as part of the training dataset so they can be shared with other iNoU nodes.

---

## Preference Dimensions

| Dimension        | Values                                   |
| ---------------- | ---------------------------------------- |
| `responseLength` | `'brief'` · `'standard'` · `'detailed'`  |
| `responseFormat` | `'prose'` · `'bullets'` · `'structured'` |
| `preferTables`   | `true` · `false`                         |

---

## Signal Detection (no LLM call)

The engine checks user input against a regex table **before** sending anything to Gemini.
If a match is found the preference is saved, a localised confirmation is shown,
and the turn ends without an LLM call.

### Supported Languages

| Signal    | EN                      | ES             | FR                   | DE                      | PT               |
| --------- | ----------------------- | -------------- | -------------------- | ----------------------- | ---------------- |
| Brief     | "shorter", "be concise" | "más breve"    | "plus court"         | "kürzer"                | "mais curto"     |
| Detailed  | "more details"          | "más detalles" | "plus de détails"    | "mehr Details"          | "mais detalhes"  |
| Bullets   | "bullet list"           | "viñetas"      | "puces"              | "Aufzählungszeichen"    | "pontos"         |
| Tables    | "use a table"           | "usa tabla"    | "utilise un tableau" | "verwende eine Tabelle" | "use uma tabela" |
| No tables | "no tables"             | "sin tablas"   | "pas de tableaux"    | "keine Tabellen"        | "sem tabelas"    |
| Prose     | "in prose"              | "en prosa"     | "en prose"           | "in Prosa"              | "em prosa"       |

---

## Persistence

Preferences are stored in `.inuo-state.json` under `userPreferences[]`.
Each entry is keyed by `userId` and tracks `signalCount` and `updatedAt`.

```json
{
  "userPreferences": [
    {
      "userId": "user_local",
      "responseLength": "brief",
      "responseFormat": "bullets",
      "preferTables": false,
      "signalCount": 3,
      "updatedAt": "2026-08-14T12:00:00.000Z"
    }
  ]
}
```

---

## LLM Prompt Injection

`buildPreferencePromptBlock()` converts stored preferences into an instruction block
that is injected into every `processNaturalLanguageIntent()` call:

```
USER FORMAT PREFERENCES (learned — apply unconditionally):
- Keep responses short — minimal elaboration, short sentences.
- Always use bullet lists (- item) for any multi-item content.
- Never use tables — use plain text or bullet lists only.
```

This block is injected between the Succinct Mode mandate and the system overview section,
giving it higher priority than the default mode settings.

---

## Training Dataset Export & Sharing

`exportTrainingData()` includes `userPreferences[]` in the exported JSON.
When two iNoU nodes merge training datasets, format preferences from contributing users
are available to other nodes — enabling shared style conventions across a Colmena federation.

---

## Implementation Files

| File                                      | Role                                                    |
| ----------------------------------------- | ------------------------------------------------------- |
| `src/types/ResponseLength.ts`             | `'brief' \| 'standard' \| 'detailed'`                   |
| `src/types/ResponseFormat.ts`             | `'prose' \| 'bullets' \| 'structured'`                  |
| `src/interfaces/UserPreferenceProfile.ts` | Preference record shape                                 |
| `src/cli/preferenceEngine.ts`             | Detection · persistence · prompt injection              |
| `src/cli/shell.ts`                        | Calls `handleFormatSignal()` before LLM in default case |
| `src/cli/aiClient.ts`                     | Injects `buildPreferencePromptBlock()` into prompt      |
| `src/cli/learningEngine.ts`               | Exports `userPreferences` in training dataset           |

---

## Open Items

- Detect tone preferences ("formal", "casual") — add `preferFormalTone?: boolean`.
- Surface current preferences in `mode status` output.
- Allow explicit CLI override: `mode format bullets`, `mode length brief`.
- Decay old signals over time (lower `signalCount` weight after N sessions).

---
---

# AI Usage Tracking

## Problem

No visibility into how many tokens are consumed per session, per command, or in total.
No budget control. Users cannot tell how much of their API quota has been used or how close they
are to a self-imposed limit.

## Design

### New Interface — `AiUsageRecord`

```ts
// src/interfaces/AiUsageRecord.ts
export interface AiUsageRecord {
  id: string;            // unique record ID
  providerId: string;    // e.g. "gemini-primary"
  model: string;         // e.g. "gemini-3.6-flash"
  command: string;       // shell command or intent type that triggered the call
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  timestamp: string;     // ISO
}
```

### New Interface — `AiUsageSummary`

```ts
// src/interfaces/AiUsageSummary.ts
export interface AiUsageSummary {
  providerId: string;
  model: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  budgetLimitUsd?: number;
  budgetUsedPct?: number;   // 0–100, only present when budgetLimitUsd is set
  periodStart: string;      // ISO — start of tracked window
}
```

### Extended `AIProviderConfig` (see Multi-AI section below)

Add `costPerInputToken` and `costPerOutputToken` (USD per token, e.g. `0.000_000_075` for
Gemini Flash input) so `usageEngine` can compute cost without hardcoding model prices.

### Capturing Token Counts

`@google/genai` exposes `response.usageMetadata` with `promptTokenCount`,
`candidatesTokenCount`, and `totalTokenCount`. `aiClient.ts` must read these after every
`generateContent()` call and pass them to `usageEngine.recordUsage()`.

### New Engine — `src/cli/usageEngine.ts`

```
recordUsage(record: Omit<AiUsageRecord, 'id'>): void
  — appends to state.aiUsageLog[]

getSummary(providerId: string, sinceIso?: string): AiUsageSummary
  — aggregates from state.aiUsageLog

formatUsageDisplay(summary: AiUsageSummary): string
  — returns a human-readable block for CLI + web

resetUsage(providerId: string): void
  — clears aiUsageLog for that provider
```

### StateData additions

```ts
aiUsageLog?: AiUsageRecord[];   // rolling log, trimmed to last 1 000 records
```

### CLI command: `ai usage`

```
ai usage                  — summary for active provider
ai usage --provider <id>  — summary for specific provider
ai usage --reset          — clear log for active provider
```

Example output:

```
=== AI Usage — gemini-primary (gemini-3.6-flash) ===

Requests:       42
Input tokens:   38 420   (▓▓▓▓▓▓░░░░  64%)
Output tokens:  12 180
Total tokens:   50 600
Est. cost:      $0.0038
Budget limit:   $0.006 0
Budget used:    63%  ▓▓▓▓▓▓░░░░

Period start: 2026-08-14T00:00:00Z
```

### Web UI pill

Add a `usage-pill` in the header bar showing `AI: 63%` (budget % when a limit is set)
or the total token count when no limit is configured.
Updates via the existing `/api/status` response — add `aiUsage` field.

---
---

# Multi-AI Provider Configuration

## Problem

Only Google Gemini is supported. API key, model, and costs are partially hardcoded.
Users need to configure additional providers (OpenAI, Anthropic, local Ollama) and switch
between them without touching source code.

## Design

### New Type — `AIProvider`

```ts
// src/types/AIProvider.ts
export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'custom';
```

### New Interface — `AIProviderConfig`

```ts
// src/interfaces/AIProviderConfig.ts
export interface AIProviderConfig {
  id: string;                       // e.g. "gemini-primary"
  provider: AIProvider;
  model: string;                    // e.g. "gemini-3.6-flash", "gpt-4o", "claude-sonnet-4-5"
  apiKeyRef: string;                // key name in .inuo-key.json, not the key itself
  isActive: boolean;                // only one provider active at a time
  baseUrl?: string;                 // for Ollama / custom OpenAI-compatible endpoints
  costPerInputToken: number;        // USD per token
  costPerOutputToken: number;       // USD per token
  tokenBudgetLimit?: number;        // soft budget in USD; triggers warnings at 80%
  capabilities: AICapability[];     // what this provider supports
  addedAt: string;
}
```

### New Type — `AICapability`

```ts
// src/types/AICapability.ts
export type AICapability =
  | 'intent-classification'
  | 'decomposition'
  | 'self-awareness-synthesis'
  | 'evolve'
  | 'embedding';
```

### StateData additions

```ts
aiProviders?: AIProviderConfig[];   // replaces the single geminiApiKey in Environment
```

Keys remain in `.inuo-key.json` under a flat map `{ [apiKeyRef]: string }`.
`Environment` retains `geminiApiKey` for backwards compatibility but is deprecated in favour
of the active `AIProviderConfig`.

### Provider-agnostic call layer

Extract an `invokeAI(prompt, rootDir)` function in `aiClient.ts` that:
1. Reads the active `AIProviderConfig` from state.
2. Dispatches to the correct client adapter (`geminiAdapter`, `openaiAdapter`, `anthropicAdapter`, `ollamaAdapter`).
3. Returns a normalised `{ text: string; inputTokens: number; outputTokens: number }`.

Existing `processNaturalLanguageIntent` becomes a thin wrapper over `invokeAI`.

### CLI command: `ai`

```
ai status                              — show active provider + connection health
ai list                                — list all configured providers
ai add --provider gemini|openai|... --model <Model> --key-ref <Ref>
ai set-active <providerId>             — switch active provider
ai remove <providerId>
ai budget --provider <id> --limit <USD>
ai models                              — list known models + price per token
```

### Agent file generation — `AGENTS.md` and copilot instructions

iNoU knows its own principles, skills, behaviors, governance rules, and active engines.
It can generate the authoritative agent directive files automatically.

#### CLI command: `agent generate`

```
agent generate agents-md               — writes AGENTS.md from current state
agent generate copilot-instructions    — writes .github/copilot-instructions.md
agent generate prompt-file <name>      — writes <name>.prompt.md in VSCODE_USER_PROMPTS_FOLDER
agent generate all                     — all three above
```

#### `AGENTS.md` content sourced from state

| Section | Source |
|---|---|
| Core Rules Reference | active `Principle[]` (immutable first) |
| Interaction Formula | canonical formula from `INUO_SPEC.md` |
| Verb Catalog | `customVerbs[]` + baseline verbs |
| Governance Engines | `engines[]` |
| Skill Registry | `skills[]` |
| Trust & Safety | trust threshold gates + zero-tolerance principle |

#### `copilot-instructions.md` content

Condensed version of the above — single-file instructions optimised for Copilot context
window consumption (≤ 400 tokens target).

### Implementation Files

| File | Role |
|---|---|
| `src/types/AIProvider.ts` | Provider identifier union |
| `src/types/AICapability.ts` | Capability tags |
| `src/interfaces/AIProviderConfig.ts` | Per-provider configuration |
| `src/interfaces/AiUsageRecord.ts` | Single LLM call record |
| `src/interfaces/AiUsageSummary.ts` | Aggregated usage summary |
| `src/cli/usageEngine.ts` | Record · summarise · format · reset |
| `src/cli/aiClient.ts` | Capture `usageMetadata` after every call; dispatch via provider |
| `src/cli/agentGenerateCommand.ts` | `agent generate` subcommands |
| `src/cli/shell.ts` | Register `ai` and `agent` commands |
| `public/index.html` + `browser/app.ts` | Add `usage-pill` to header |
| `src/cli/webServer.ts` | Expose `aiUsage` in `/api/status` response |
