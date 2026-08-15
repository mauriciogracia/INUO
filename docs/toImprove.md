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

## Future Work

- Detect tone preferences ("formal", "casual") — add `preferFormalTone?: boolean`.
- Persist language preference separately from auto-detection.
- Surface current preferences in `mode status` output.
- Allow explicit CLI override: `mode format bullets`, `mode length brief`.
- Decay old signals over time (lower `signalCount` weight after N sessions).
