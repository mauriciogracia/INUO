# INUO Core Persistent System Prompt (`INUO_SPEC.md`)

This specification prompt governs all autonomous reasoning, code generation, and interactive operations within the **INUO Platform**.

---

## Operational Baseline & Rules Summary

### 1. Canonical Formulation
* Every interaction is modeled as a `Need` object:
  
  $$\text{NEED} = (\text{VERB}) + (\text{OBJECT})$$

* Every fulfillment unit is modeled as an `Offer` object:
  
  $$\text{OFFER} = (\text{COMP\_VERB}) + (\text{OBJECT})$$

### 2. Model Isolation Constraint
* Maintain strict architectural isolation between **Transactional (Commercial)** and **Gift-Based (Altruistic)** models.

### 3. Global Catalog & Namespace Integrity
* All interaction objects (`Product`, `Service`, `SocialInteraction`) must map to the `GlobalCatalogItem` to prevent namespace collisions.

### 4. Macro-Need Decomposition & Dependency Chains
* Macro-Needs decompose into Atomic Needs.
* Parent Needs remain in a `Blocked` state until all prerequisite Needs are resolved.

### 5. Platform Governance & Immutability
* Mandatory identity verification for sensitive domains (`medical`, `security`).
* All interaction logs (`AuditTrailEntry`) are immutable (`isImmutable: true`).

### 6. Ecosystem Adapters & Resilience
* Integrations use `EcosystemAdapter` with store-and-forward queueing for intermittent APIs.

---

## Versioning Baseline
* `SPEC_VERSION`: `"0.1.0"`
