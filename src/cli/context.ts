import fs from "fs";
import path from "path";
import { InuoManifest } from "../interfaces/InuoManifest";
import { Need } from "../interfaces/Need";
import { Offer } from "../interfaces/Offer";
import { Match } from "../interfaces/Match";
import { CLICommandContext } from "../interfaces/CLICommandContext";
import { NeedDoubt } from "../interfaces/NeedDoubt";
import { Skill } from "../interfaces/Skill";
import { Behavior } from "../interfaces/Behavior";
import { Rule } from "../interfaces/Rule";
import { Principle } from "../interfaces/Principle";
import { UserRole } from "../types/UserRole";

export function getProjectPaths(rootDir: string = process.cwd()) {
  return {
    rootDir,
    manifestPath: path.join(rootDir, "inuo-manifest.json"),
    specPath: path.join(rootDir, "INUO_SPEC.md"),
    statePath: path.join(rootDir, ".inuo-state.json"),
  };
}

export function loadManifest(manifestPath: string): InuoManifest | null {
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    return JSON.parse(raw) as InuoManifest;
  } catch {
    return null;
  }
}

export interface CustomVerbPairing {
  verb: string;
  complement: string;
}

import { UserIdentity } from "../interfaces/UserIdentity";
import { LearnedCorrection } from "../interfaces/LearnedCorrection";
import { MCPServerConfig } from "../interfaces/MCPServerConfig";
import { ColmenaNode } from "../interfaces/ColmenaNode";
import { TrustRecord } from "../interfaces/TrustRecord";
import { ClientDeviceConfig } from "../interfaces/ClientDeviceConfig";
import { EmergencyContext } from "../interfaces/EmergencyContext";
import { TrustedMemberConfig } from "../interfaces/TrustedMemberConfig";
import { EngineConfig } from "../interfaces/EngineConfig";
import { BiometricVaultEntry } from "../interfaces/BiometricVaultEntry";
import { TrustThresholdGate } from "../interfaces/TrustThresholdGate";
import { OperatingModeConfig } from "../interfaces/OperatingModeConfig";
import { InteractiveQuestionSpec } from "../interfaces/InteractiveQuestionSpec";
import { MasterMindSyncProgress } from "../interfaces/MasterMindSyncProgress";
import { UserPreferenceProfile } from "../interfaces/UserPreferenceProfile";
import { LLMConfiguration } from "../interfaces/LLMConfiguration";
import { WorkflowNode } from "../interfaces/WorkflowNode";
import { SocialNetworkConfiguration } from "../interfaces/SocialNetworkConfiguration";

export interface StateData {
  needs: Need[];
  offers: Offer[];
  matches: Match[];
  customVerbs?: CustomVerbPairing[];
  doubts?: NeedDoubt[];
  currentRole?: UserRole;
  activeUser?: UserIdentity;
  learnedCorrections?: LearnedCorrection[];
  skills?: Skill[];
  behaviors?: Behavior[];
  rules?: Rule[];
  principles?: Principle[];
  mcpServers?: MCPServerConfig[];
  colmenaNodes?: ColmenaNode[];
  trustRecords?: TrustRecord[];
  masterMindId?: string;
  clientDevices?: ClientDeviceConfig[];
  emergencyContext?: EmergencyContext;
  trustedMembers?: TrustedMemberConfig[];
  engines?: EngineConfig[];
  localAuthVault?: BiometricVaultEntry[];
  thresholdGates?: TrustThresholdGate[];
  operatingMode?: OperatingModeConfig;
  interactiveQuestions?: InteractiveQuestionSpec[];
  progressiveSyncs?: MasterMindSyncProgress[];
  userPreferences?: UserPreferenceProfile[];
  llmConfigurations?: LLMConfiguration[];
  workflowNodes?: WorkflowNode[];
  socialNetworkConfigurations?: SocialNetworkConfiguration[];
}

export const BASELINE_ENGINES: EngineConfig[] = [
  {
    engineId: "engine_trust",
    engineName: "Dynamic Trust & Anti-Manipulation Engine",
    description:
      "Collection of behaviors governing trust scoring, prompt injection defense, and sub-2ms circuit breaker disconnects.",
    behaviorIds: [
      "behavior_anti_manipulation",
      "behavior_circuit_breaker",
      "behavior_trusted_members",
    ],
    createdBy: "MasterTrainer",
    isImmutable: true,
    updatedAt: "2026-08-14T00:00:00.000Z",
  },
  {
    engineId: "engine_emergency",
    engineName: "Vehicle & Device Emergency Context Engine",
    description:
      "Collection of behaviors handling owner incapacitation, family fallback authorization, and stranger command defense.",
    behaviorIds: [
      "behavior_owner_incapacitation",
      "behavior_family_emergency",
      "behavior_stranger_defense",
    ],
    createdBy: "MasterTrainer",
    isImmutable: true,
    updatedAt: "2026-08-14T00:00:00.000Z",
  },
  {
    engineId: "engine_self_awareness",
    engineName: "Self-Awareness & Trust-Gated Reflection Engine",
    description:
      "Collection of behaviors governing platform self-reflection, versioning, and trust-gated spec disclosures.",
    behaviorIds: [
      "behavior_trust_gated_self_reflection",
      "behavior_spec_disclosure",
    ],
    createdBy: "MasterTrainer",
    isImmutable: true,
    updatedAt: "2026-08-14T00:00:00.000Z",
  },
  {
    engineId: "engine_social_broadcast",
    engineName: "Multi-Platform Social Broadcast Engine",
    description:
      "Collection of API integration behaviors orchestrating simultaneous posts across X/Twitter, LinkedIn, Facebook, and Telegram.",
    behaviorIds: [
      "behavior_post_twitter",
      "behavior_post_linkedin",
      "behavior_post_facebook",
      "behavior_post_telegram",
    ],
    createdBy: "MasterTrainer",
    isImmutable: true,
    updatedAt: "2026-08-14T00:00:00.000Z",
  },
];

export const BASELINE_PRINCIPLES: Principle[] = [
  {
    id: "principle_zero_tolerance",
    name: "Zero Tolerance Safety",
    statement:
      "Strict enforcement of zero-tolerance policies prohibiting illegal exploitation and harmful transactions.",
    createdBy: "MasterTrainer",
    isImmutable: true,
    status: "Locked",
    createdAt: new Date().toISOString(),
  },
  {
    id: "principle_canonical_formulation",
    name: "Canonical Formula Integrity",
    statement:
      "Every interaction unit MUST adhere to NEED = (VERB) + (OBJECT) and OFFER = (COMP_VERB) + (OBJECT).",
    createdBy: "MasterTrainer",
    isImmutable: true,
    status: "Locked",
    createdAt: new Date().toISOString(),
  },
];

export const BASELINE_SKILLS: Skill[] = [
  {
    id: "skill_decompose",
    name: "RecursiveDecomposition",
    description: "Decomposes macro needs into hierarchical atomic needs.",
    verbCategory: "Plan",
    createdAt: new Date().toISOString(),
  },
  {
    id: "skill_match",
    name: "IntentMatching",
    description: "Pairs complementary Needs and Offers based on catalog verbs.",
    verbCategory: "Match",
    createdAt: new Date().toISOString(),
  },
  {
    id: "skill_verify",
    name: "SpecVerification",
    description: "Verifies codebase alignment against INUO_SPEC.md.",
    verbCategory: "Verify",
    createdAt: new Date().toISOString(),
  },
];

export const BASELINE_BEHAVIORS: Behavior[] = [
  {
    id: "behavior_planner",
    name: "PlanningBehavior",
    description: "Autonomous planning and hierarchical detailing workflow.",
    skillIds: ["skill_decompose", "skill_verify"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "behavior_fulfillment",
    name: "FulfillmentBehavior",
    description: "Intent parsing and matching workflow.",
    skillIds: ["skill_match"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export function loadState(statePath: string): StateData {
  const defaultUser: UserIdentity = {
    userId: "user_local_1",
    userName: "RegularUser",
    role: "RegularUser",
    authenticatedAt: new Date().toISOString(),
  };

  const defaultMode: OperatingModeConfig = {
    currentMode: "promptMe",
    detectedLanguage: "es",
    autoDetectLanguage: true,
    isSuccinctMode: true,
    debugLevel: 3,
    authRequiredOnStart: false,
    updatedAt: new Date().toISOString(),
  };

  if (!fs.existsSync(statePath)) {
    return {
      needs: [],
      offers: [],
      matches: [],
      customVerbs: [],
      doubts: [],
      currentRole: "RegularUser",
      activeUser: defaultUser,
      learnedCorrections: [],
      skills: [...BASELINE_SKILLS],
      behaviors: [...BASELINE_BEHAVIORS],
      rules: [],
      principles: [...BASELINE_PRINCIPLES],
      mcpServers: [],
      colmenaNodes: [],
      trustRecords: [],
      masterMindId: "master_mind_primary",
      clientDevices: [],
      emergencyContext: {
        status: "Normal",
        authorizedFamilyUserIds: [],
        activatedAt: new Date().toISOString(),
      },
      trustedMembers: [],
      engines: [...BASELINE_ENGINES],
      localAuthVault: [],
      thresholdGates: [],
      operatingMode: defaultMode,
      interactiveQuestions: [],
      progressiveSyncs: [],
      userPreferences: [],
      llmConfigurations: [],
      workflowNodes: [],
      socialNetworkConfigurations: [],
    };
  }
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw) as StateData;
    return {
      needs: parsed.needs || [],
      offers: parsed.offers || [],
      matches: parsed.matches || [],
      customVerbs: parsed.customVerbs || [],
      doubts: parsed.doubts || [],
      currentRole: parsed.currentRole || "RegularUser",
      activeUser: parsed.activeUser || defaultUser,
      learnedCorrections: parsed.learnedCorrections || [],
      skills:
        parsed.skills && parsed.skills.length > 0
          ? parsed.skills
          : [...BASELINE_SKILLS],
      behaviors:
        parsed.behaviors && parsed.behaviors.length > 0
          ? parsed.behaviors
          : [...BASELINE_BEHAVIORS],
      rules: parsed.rules || [],
      principles:
        parsed.principles && parsed.principles.length > 0
          ? parsed.principles
          : [...BASELINE_PRINCIPLES],
      mcpServers: parsed.mcpServers || [],
      colmenaNodes: parsed.colmenaNodes || [],
      trustRecords: parsed.trustRecords || [],
      masterMindId: parsed.masterMindId || "master_mind_primary",
      clientDevices: parsed.clientDevices || [],
      emergencyContext: parsed.emergencyContext || {
        status: "Normal",
        authorizedFamilyUserIds: [],
        activatedAt: new Date().toISOString(),
      },
      trustedMembers: parsed.trustedMembers || [],
      engines:
        parsed.engines && parsed.engines.length > 0
          ? parsed.engines
          : [...BASELINE_ENGINES],
      localAuthVault: parsed.localAuthVault || [],
      thresholdGates: parsed.thresholdGates || [],
      operatingMode: parsed.operatingMode || defaultMode,
      interactiveQuestions: parsed.interactiveQuestions || [],
      progressiveSyncs: parsed.progressiveSyncs || [],
      userPreferences: parsed.userPreferences || [],
      llmConfigurations: parsed.llmConfigurations || [],
      workflowNodes: parsed.workflowNodes || [],
      socialNetworkConfigurations: parsed.socialNetworkConfigurations || [],
    };
  } catch {
    return {
      needs: [],
      offers: [],
      matches: [],
      customVerbs: [],
      doubts: [],
      currentRole: "RegularUser",
      activeUser: defaultUser,
      learnedCorrections: [],
      skills: [...BASELINE_SKILLS],
      behaviors: [...BASELINE_BEHAVIORS],
      rules: [],
      principles: [...BASELINE_PRINCIPLES],
      mcpServers: [],
      colmenaNodes: [],
      trustRecords: [],
      masterMindId: "master_mind_primary",
      clientDevices: [],
      emergencyContext: {
        status: "Normal",
        authorizedFamilyUserIds: [],
        activatedAt: new Date().toISOString(),
      },
      trustedMembers: [],
      engines: [...BASELINE_ENGINES],
      localAuthVault: [],
      thresholdGates: [],
      operatingMode: defaultMode,
      interactiveQuestions: [],
      progressiveSyncs: [],
      userPreferences: [],
      llmConfigurations: [],
      workflowNodes: [],
      socialNetworkConfigurations: [],
    };
  }
}

export function saveState(statePath: string, data: StateData): void {
  fs.writeFileSync(statePath, JSON.stringify(data, null, 2), "utf8");
}

export function createContext(
  rootDir: string = process.cwd(),
): CLICommandContext {
  const paths = getProjectPaths(rootDir);
  const manifest = loadManifest(paths.manifestPath);
  const state = loadState(paths.statePath);

  return {
    manifestPath: paths.manifestPath,
    specPath: paths.specPath,
    manifest,
    needs: state.needs,
    offers: state.offers,
    matches: state.matches,
  };
}
