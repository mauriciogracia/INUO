# INUO Platform & Interactive Shell CLI (`v0.1.0`)

> **INUO** is a universal interaction matching protocol and self-orchestrating platform built around canonical Need and Offer formulations.

---

## 🌟 Key Features

### 1. Interactive Shell REPL (`./inuo.sh`)
An interactive terminal interface to interact with your project, manage Needs/Offers, run Interaction Engine matching, and trigger automated lifecycle tasks.

```bash
# Launch interactive shell
./inuo.sh
```

---

### 2. Google Gemini AI Intent Parsing
Talk to `inuo` using natural language! Any prompt entered into `./inuo.sh` that is not a fixed subcommand is automatically parsed by **Google Gemini 2.5 Flash** into canonical $\text{NEED} = (\text{VERB}) + (\text{OBJECT})$ or $\text{OFFER} = (\text{COMP\_VERB}) + (\text{OBJECT})$ structures.

```text
inuo (v0.1.0) > key AIzaSyYourGeminiApiKey...
✔ Successfully saved and connected Google Gemini API key!

inuo (v0.1.0) > I need emergency geotechnical surveying for shifting desert sand
[Gemini AI Intent Parser] Analyzing natural language intent...
✔ AI Parsed Need Intent: NEED = (Consult) + (Geotechnical survey)
✔ Created Need: NEED = (Consult) + (Geotechnical survey) [ID: need_178669...]
```

---

### 3. INUO-on-INUO Recursive Self-Evolution Engine
Evolve the platform using the platform! The `evolve` command accepts a Product Owner goal, semantically decomposes it using Gemini AI, generates single-definition TypeScript files (`src/interfaces/`, `src/types/`, `src/enums/`), runs automated verification tests, and automatically updates [`INUO_SPEC.md`](file:///d:/repos/INUO/INUO_SPEC.md) and bumps `SPEC_VERSION` when verified.

```text
inuo (v0.1.0) > evolve "Add JWT Auth Provider to Ecosystem Adapter"
```

---

### 4. Automated Spec Sync & Rollback Protocol
- Compares `SPEC_VERSION` in [`INUO_SPEC.md`](file:///d:/repos/INUO/INUO_SPEC.md) against `inuo-manifest.json`.
- **Verification Passed**: Automatically upgrades version snapshot.
- **Verification Failed**: Automatically triggers rollback (`inuo rollback [PREVIOUS_VERSION]`) to revert to the last stable state.

---

## 📐 Architecture & Development Directives

All development in this repository strictly adheres to [`DEV_RULES.md`](file:///d:/repos/INUO/DEV_RULES.md), the **single source of truth** for project rules:

1. **Single Definition per File**: Every `enum`, `type` alias, and `interface` **MUST** reside in its own dedicated file:
   - `src/enums/`: Enums (e.g., `NeedStatusEnum.ts`)
   - `src/types/`: Type Aliases (e.g., `NeedStatus.ts`)
   - `src/interfaces/`: Interfaces (e.g., `Need.ts`)
2. **DRY & SOLID Principles**: duplicitous logic or schema definitions are strictly prohibited.
3. **Build Artifact Isolation**: Compiled JavaScript output is emitted to `dist/` and excluded via `.gitignore`. Source code in `src/` contains **only pure TypeScript (`.ts`)**.

---

## 🚀 Quick Start

### Installation & Build

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Launch INUO Shell
./inuo.sh
```

### Running Unit Tests

```bash
# Executes complete automated test suite (23/23 passing)
npm test
```

---

## 📖 Interactive Shell Command Reference

| Command | Description |
| :--- | :--- |
| `evolve <goal>` | Self-orchestrating dev loop: decompose PO intent, generate TS code, verify tests & update spec |
| `sync` | Detect spec changes and execute automated sync & verification |
| `key <API_KEY>` | Connect or check Google Gemini API Key |
| `init` / `bootstrap` | Initialize `INUO_SPEC.md` system prompt and `inuo-manifest.json` |
| `status` | Display specification version, sync status, and item counts |
| `catalog` | List Global Catalog of Verbs and Complement pairings |
| `need list` | List active Needs |
| `need create --verb V --object O` | Create a new Need object |
| `offer list` | List active Offers |
| `offer create --verb V --object O` | Create a new Offer object |
| `match` | Run matching engine to pair open Needs with Offers |
| `test [version]` | Execute specification version and file structure verification |
| `rollback <version>` | Rollback `SPEC_VERSION` to a previous version snapshot |
| `<Natural Language>` | AI automatically parses intent & instantiates Need/Offer |
| `help` | Display command guide |
| `exit` / `quit` | Exit the interactive shell |

---

## 📜 License

MIT License - Copyright (c) INUO Development Team.
