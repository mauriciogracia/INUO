# INUO Development Rules & Architectural Directives (`DEV_RULES.md`)

This document outlines the mandatory architectural principles, coding standards, and governance rules for all contributors and autonomous agents (Seed Agents) developing on the **INUO Platform**.

---

## 1. Core Interaction Principles

### 1.1 Canonical Formulation Rule

- Every user intent or platform operation **MUST** be modeled as a `Need` object following the canonical formula:

  $$\text{NEED} = (\text{VERB}) + (\text{OBJECT})$$

- Matching fulfillment units **MUST** pair a corresponding `COMP_VERB` (Offer) with the same `OBJECT`:

  $$\text{OFFER} = (\text{COMP\_VERB}) + (\text{OBJECT})$$

### 1.2 Global Catalog & Namespace Integrity

- All interaction objects (`Product`, `Service`, `SocialInteraction`) **MUST** map to an entry in the centralized `GlobalCatalog`.
- Direct instantiation of ad-hoc or unindexed object names is strictly prohibited to prevent namespace collisions.

---

## 2. Architectural Boundaries & Isolation

### 2.1 Model Isolation Constraint

- The system enforces a strict boundary between **Transactional (Commercial)** and **Gift-Based (Altruistic)** models.
- Cross-contamination of fulfillment logic, pricing, or altruistic state handling is **STRICTLY PROHIBITED**.
- Module implementations must explicitly declare their `ModelType` ('Transactional' | 'GiftBased').

### 2.2 Atomic Threshold & Dependency Graphs

- Macro-Needs (complex objectives) **MUST** be decomposed into Atomic Needs (singular, actionable transactions).
- A Parent Need **MUST** remain in a `Blocked` state until all `prerequisiteNeedIds` are fully resolved.
- Automated systems must never bypass dependency validation to activate a parent need prematurely.

---

## 3. Governance & Safety Directives

### 3.1 Trust Loop & Zero-Tolerance Policy

- Automated safety checks **MUST** evaluate all interactions against zero-tolerance frameworks (e.g., prohibition of human trafficking and exploitation).
- High-risk domains (`medical`, `security`, `financial`) **REQUIRE** mandatory identity verification prior to interaction matching.

### 3.2 Immutable Audit Trail

- All interaction logs, messages, and state transitions **MUST** be preserved in an immutable audit ledger (`AuditTrailEntry`).
- Methods attempting to delete or overwrite sent messages or transaction logs are prohibited.

---

## 4. Ecosystem & Infrastructure Directives

### 4.1 Adapter Pattern Enforcement

- External service integrations (e.g., Uber, LinkedIn, MercadoLibre) **MUST** be implemented using the `EcosystemAdapter` pattern.
- Third-party API calls must pass through the **LLM-Broker Middleware** for intent-to-payload JSON/REST translation and OAuth 2.0 identity unification.

### 4.2 Offline-First & Intermittent Service Resilience

- External endpoints **MUST** be treated as intermittent resources.
- When external endpoints are unreachable, the system must retain local state and queue requests (`queuedRequestsCount`) rather than failing abruptly.

---

## 5. INUO-on-INUO (Self-Orchestrating Dev Lifecycle)

### 5.1 Codebase as Global Catalog

- Every function, service, and module in the repository is treated as an item in the codebase catalog, indexed by its `Verb + Object` purpose.
- Before writing new code, agents **MUST** query the catalog for existing modules to reuse or refactor.

### 5.2 Bootstrapping & Manifest Sync

- Every environment initialization **MUST** load `INUO_SPEC.md` as its persistent system prompt.
- Every release **MUST** update `inuo-manifest.json` with the target `SPEC_VERSION` adhering to Semantic Versioning (`MAJOR.MINOR.PATCH`).
- Structural directory mappings **MUST** map `Verb + Object` pairs to discrete, isolated service modules.

### 5.3 Automated Quality Control & Rollback

- Deployment performance metrics are continuously monitored.
- If metrics degrade, an automated `Need` ("Fix performance degradation") is created to trigger a new development cycle.
- If test verification (`inuo-cli test --version [SPEC_VERSION]`) fails, the environment **MUST** immediately execute `inuo-cli rollback [PREVIOUS_VERSION]`.

### 5.4 Specification Version vs CLI Tool Version Separation

- **SPEC_VERSION**: Governs the canonical protocol, matching formulas, safety rules, and Global Catalog schemas.
- **CLI Version**: Governs the `inou.sh` software shell implementation and tooling features.
- Bumping the `inou.sh` CLI tool version does **NOT** change or break `SPEC_VERSION` unless the underlying interaction engine protocol itself changes.
- CLI tools **MUST** display and track both `SPEC_VERSION` and `cliVersion` distinctly.

---

## 6. Code Organization & Type Directives

### 6.1 Single Definition per File & Directory Separation Rule

- Every `type` alias, `enum`, and `interface` **MUST** reside in its own dedicated file in its respective directory under `src/`:
  - **Enums**: Placed in `src/enums/` (e.g., `src/enums/NeedStatusEnum.ts`).
  - **Type Aliases**: Placed in `src/types/` (e.g., `src/types/NeedStatus.ts`).
  - **Interfaces**: Placed in `src/interfaces/` (e.g., `src/interfaces/Need.ts`).
- Grouping multiple interfaces, types, or enums inside a single file is **STRICTLY PROHIBITED**.
- Each directory **MUST** maintain a barrel export (`index.ts`) re-exporting its single-definition files cleanly.

### 6.2 Software Design Principles (DRY & SOLID)

- **DRY (Don't Repeat Yourself)**: Code logic, constants, formulas, and schema mappings **MUST NOT** be duplicated across files. Shared functionality must be refactored into reusable single-responsibility utilities or barrel-exported interfaces.
- **SOLID Principles**:
  - **Single Responsibility Principle (SRP)**: Each file must contain exactly one type/enum/interface definition or one discrete service module.
  - **Open/Closed Principle (OCP)**: Platform components (e.g., Interaction Engine, Ecosystem Adapters) must be open for extension via new verb/complement pairings or adapter providers without modifying core engine logic.
  - **Liskov Substitution Principle (LSP)**: Derived adapters and domain implementations must be fully substitutable for their base interface abstractions (`EcosystemAdapter`, `Need`).
  - **Interface Segregation Principle (ISP)**: Interfaces must remain focused and granular so components depend only on the properties they actually consume.
  - **Dependency Inversion Principle (DIP)**: High-level lifecycle services and commands must depend on abstract interfaces (`Environment`, `InuoManifest`, `Need`) rather than hardcoded low-level details.
