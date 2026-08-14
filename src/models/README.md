# INUO Core Domain Models & Entities

This directory contains the canonical data models and entities identified from the **INUO Global Specification** (`INUO_BASE.pdf` / `tocs/base_00.specs.md`), structured according to the single-definition per file rule in [`DEV_RULES.md`](file:///d:/repos/INUO/DEV_RULES.md).

## Overview of Single-Definition Files

| File | Type / Interface | Description |
| :--- | :--- | :--- |
| [`ModelType.ts`](file:///d:/repos/INUO/models/ModelType.ts) | `type ModelType` | Architectural boundary (`'Transactional' \| 'GiftBased'`) |
| [`NeedStatus.ts`](file:///d:/repos/INUO/models/NeedStatus.ts) | `type NeedStatus` | Need state (`'Open' \| 'Blocked' \| 'Matched' \| ...`) |
| [`KnownNeedVerb.ts`](file:///d:/repos/INUO/models/KnownNeedVerb.ts) | `type KnownNeedVerb` | Union of standard request verbs (`'Request'`, `'Buy'`, `'Consult'`, etc.) |
| [`Need.ts`](file:///d:/repos/INUO/models/Need.ts) | `interface Need` | Fundamental interaction unit: $\text{NEED} = (\text{VERB}) + (\text{OBJECT})$ |
| [`OfferStatus.ts`](file:///d:/repos/INUO/models/OfferStatus.ts) | `type OfferStatus` | Offer operational state (`'Available' \| 'Matched' \| ...`) |
| [`Offer.ts`](file:///d:/repos/INUO/models/Offer.ts) | `interface Offer` | Fulfillment entity: $\text{OFFER} = (\text{COMP\_VERB}) + (\text{OBJECT})$ |
| [`MatchStatus.ts`](file:///d:/repos/INUO/models/MatchStatus.ts) | `type MatchStatus` | Match state (`'Pending' \| 'Validated' \| 'Fulfilled' \| 'Rejected'`) |
| [`ExternalFulfillmentDetails.ts`](file:///d:/repos/INUO/models/ExternalFulfillmentDetails.ts) | `interface ExternalFulfillmentDetails` | External API payload & transaction details |
| [`Match.ts`](file:///d:/repos/INUO/models/Match.ts) | `interface Match` | Validated connection between Need and Offer |
| [`CatalogCategory.ts`](file:///d:/repos/INUO/models/CatalogCategory.ts) | `type CatalogCategory` | Classification (`'Product' \| 'Service' \| 'SocialInteraction'`) |
| [`VerbPairing.ts`](file:///d:/repos/INUO/models/VerbPairing.ts) | `interface VerbPairing` | Supported pairing between request verb and offer complement |
| [`GlobalCatalogItem.ts`](file:///d:/repos/INUO/models/GlobalCatalogItem.ts) | `interface GlobalCatalogItem` | Centralized catalog object to prevent namespace collisions |
| [`DependencyStatus.ts`](file:///d:/repos/INUO/models/DependencyStatus.ts) | `type DependencyStatus` | Edge resolution state (`'Blocked' \| 'Unblocked' \| 'Resolved'`) |
| [`DependencyEdge.ts`](file:///d:/repos/INUO/models/DependencyEdge.ts) | `interface DependencyEdge` | Relationship link between Parent Need and Prerequisite Need |
| [`DependencyGraph.ts`](file:///d:/repos/INUO/models/DependencyGraph.ts) | `interface DependencyGraph` | Macro-Need decomposition graph |
| [`SensitiveDomain.ts`](file:///d:/repos/INUO/models/SensitiveDomain.ts) | `type SensitiveDomain` | Domain for identity checks (`'medical' \| 'security' \| ...`) |
| [`IdentityVerification.ts`](file:///d:/repos/INUO/models/IdentityVerification.ts) | `interface IdentityVerification` | Identity verification record for sensitive domains |
| [`AuditTrailEntry.ts`](file:///d:/repos/INUO/models/AuditTrailEntry.ts) | `interface AuditTrailEntry` | Immutable interaction log entry |
| [`PolicyEnforcement.ts`](file:///d:/repos/INUO/models/PolicyEnforcement.ts) | `interface PolicyEnforcement` | Governance policy violation and suspension action |
| [`ResilienceState.ts`](file:///d:/repos/INUO/models/ResilienceState.ts) | `type ResilienceState` | Adapter connection state (`'Online' \| 'Intermittent' \| 'Offline'`) |
| [`OAuth2Config.ts`](file:///d:/repos/INUO/models/OAuth2Config.ts) | `interface OAuth2Config` | Identity unification OAuth 2.0 config |
| [`EcosystemAdapter.ts`](file:///d:/repos/INUO/models/EcosystemAdapter.ts) | `interface EcosystemAdapter` | Adapter pattern integration for external fulfillment |
| [`ServiceModuleMapping.ts`](file:///d:/repos/INUO/models/ServiceModuleMapping.ts) | `interface ServiceModuleMapping` | `Verb + Object` directory structure mapping |
| [`InuoManifest.ts`](file:///d:/repos/INUO/models/InuoManifest.ts) | `interface InuoManifest` | Operational baseline & `SPEC_VERSION` manifest |
| [`PerformanceMetric.ts`](file:///d:/repos/INUO/models/PerformanceMetric.ts) | `interface PerformanceMetric` | Quality control metric monitoring state |
| [`SelfOrchestrationTask.ts`](file:///d:/repos/INUO/models/SelfOrchestrationTask.ts) | `interface SelfOrchestrationTask` | Self-orchestrating development lifecycle task |
