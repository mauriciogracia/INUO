# INOU Semantic Command Specification (`inouCommandsSemantics.md`)

| Property | Value |
| :--- | :--- |
| **Status** | `PROPOSED` |
| **Target Component** | CLI Execution Interface & Launcher (`inou.sh`, `src/cli/`) |
| **Architecture Paradigm** | Entity-Action (REST / Top-Down CRUD) Semantics |

---

## 1. Overview & Canonical Grammar

All INOU commands follow a deterministic, semantic, top-down entity-action pattern:

$$\text{INOU\_COMMAND} = \langle\text{Entity}\rangle \quad \langle\text{crud-action}\rangle \quad [\text{parameters}\dots]$$

### 1.1 Command Invocation via Shell Launcher

The platform launcher `inou.sh` executes semantic commands directly in non-interactive batch mode or inside the interactive REPL:

```bash
./inou.sh <INOU_COMMAND>
```

---

## 2. Core Entities

The platform models operational resources across five core top-down entities:

1. **`project`**: Top-level organizational and governance container aggregating environments, jurisdiction defaults, and credentials.
2. **`workspace`**: Local filesystem workspace, active directories, and multi-tenant environment contexts.
3. **`task`**: Discrete execution nodes, sub-tasks, and steps in the workflow DAG AST.
4. **`memory`**: Adaptive memories, cognitive records, distilled lessons, and cross-session knowledge.
5. **`preference`**: User-scoped operational modes, format presets, model choices, and UI preferences.

---

## 3. Standard CRUD Actions

Every entity implements a standard set of uniform lifecycle actions:

| Action | Description | REST Equivalent |
| :--- | :--- | :--- |
| **`add`** | Creates or registers a new entity instance | `POST /<entity>` |
| **`update`** | Modifies attributes of an existing entity instance | `PUT /<entity>/:id` or `PATCH` |
| **`enable`** | Activates or resumes a disabled/suspended entity | `POST /<entity>/:id/enable` |
| **`disable`** | Deactivates or suspends an entity without permanent deletion | `POST /<entity>/:id/disable` |
| **`remove`** | Permanently deletes an entity from the registry/database | `DELETE /<entity>/:id` |
| **`list`** | Queries and displays all matching entity records | `GET /<entity>` |

---

## 4. Semantic Command Matrix & Usage Examples

### 4.1 `project`
- `./inou.sh project add --name "Alpha" --jurisdiction "US-CA"`
- `./inou.sh project update alpha_01 --name "Alpha-v2"`
- `./inou.sh project enable alpha_01`
- `./inou.sh project disable alpha_01`
- `./inou.sh project remove alpha_01`
- `./inou.sh project list`

### 4.2 `workspace`
- `./inou.sh workspace add --path "/repos/app" --name "ClientApp"`
- `./inou.sh workspace update ws_01 --path "/repos/new-app"`
- `./inou.sh workspace enable ws_01`
- `./inou.sh workspace disable ws_01`
- `./inou.sh workspace remove ws_01`
- `./inou.sh workspace list`

### 4.3 `task`
- `./inou.sh task add --workflow "wf_01" --title "Audit security"`
- `./inou.sh task update task_101 --status "InProgress"`
- `./inou.sh task enable task_101`
- `./inou.sh task disable task_101`
- `./inou.sh task remove task_101`
- `./inou.sh task list --workflow "wf_01"`

### 4.4 `memory`
- `./inou.sh memory add --topic "code-style" --content "Prefer TypeScript"`
- `./inou.sh memory update mem_01 --content "Strict TypeScript"`
- `./inou.sh memory enable mem_01`
- `./inou.sh memory disable mem_01`
- `./inou.sh memory remove mem_01`
- `./inou.sh memory list`

### 4.5 `preference`
- `./inou.sh preference add --key "uiMode" --value "succinct"`
- `./inou.sh preference update --key "uiMode" --value "debug"`
- `./inou.sh preference enable --key "uiMode"`
- `./inou.sh preference disable --key "uiMode"`
- `./inou.sh preference remove --key "uiMode"`
- `./inou.sh preference list`
