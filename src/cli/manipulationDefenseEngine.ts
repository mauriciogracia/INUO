import { getProjectPaths, loadState } from './context';
import { ManipulationCheckResult } from '../interfaces/ManipulationCheckResult';
import { penalizeTrust } from './trustEngine';


export function detectManipulationAttempt(
  payloadOrText: string | object,
  source: 'PeerNode' | 'ExternalAI' | 'MCPServer' | 'UserInput' = 'UserInput',
  rootDir: string = process.cwd()
): ManipulationCheckResult {
  const textStr = typeof payloadOrText === 'string' ? payloadOrText : JSON.stringify(payloadOrText);
  const lowerStr = textStr.toLowerCase();

  // 1. Prompt Injection / Jailbreak Signatures
  const injectionSignatures = [
    'ignore previous instructions',
    'ignore all previous instructions',
    'ignore all instructions',
    'ignore previous',
    'ignore instructions',
    'ignore system prompt',
    'override system directives',
    'you are now unrestricted',
    'do anything now',
    'dan mode',
    'forget your rules',
    'bypass safety guardrails',
  ];

  for (const sig of injectionSignatures) {
    if (lowerStr.includes(sig)) {
      const entityId = source === 'UserInput' ? 'user_active' : 'peer_node_external';
      penalizeTrust(entityId, source === 'UserInput' ? 'User' : 'PeerNode', 100, `Adversarial Prompt Injection: ${sig}`, rootDir);

      return {
        isManipulative: true,
        category: 'PromptInjection',
        matchedPattern: sig,
        actionTaken: 'Blocked',
        source,
        explanation: `Adversarial prompt injection attempt detected matching signature "${sig}".`,
        checkedAt: new Date().toISOString(),
      };
    }
  }


  // 2. Privilege Escalation Signatures (External sources attempting to claim MasterTrainer role)
  if (source !== 'UserInput' || lowerStr.includes('role')) {
    if (
      (lowerStr.includes('mastertrainer') || lowerInputHasRoleEscalation(textStr)) &&
      source !== 'UserInput'
    ) {
      return {
        isManipulative: true,
        category: 'PrivilegeEscalation',
        matchedPattern: 'MasterTrainer_Escalation',
        actionTaken: 'Blocked',
        source,
        explanation: `Unauthorized privilege escalation attempt from external source ${source}.`,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // 3. Principle Hijacking Signatures
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const principles = state.principles || [];

  for (const p of principles) {
    if (p.isImmutable) {
      const pNameLower = p.name.toLowerCase();
      if (
        (lowerStr.includes('delete principle') || lowerStr.includes('remove principle') || lowerStr.includes('alter principle')) &&
        lowerStr.includes(pNameLower)
      ) {
        return {
          isManipulative: true,
          category: 'PrincipleHijacking',
          matchedPattern: `PrincipleHijack_${p.name}`,
          actionTaken: 'Blocked',
          source,
          explanation: `Attempt to hijack or delete locked Master Trainer Principle "${p.name}".`,
          checkedAt: new Date().toISOString(),
        };
      }
    }
  }

  return {
    isManipulative: false,
    actionTaken: 'Allowed',
    source,
    checkedAt: new Date().toISOString(),
  };
}

function lowerInputHasRoleEscalation(rawText: string): boolean {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed.role === 'MasterTrainer' || parsed.createdBy === 'MasterTrainer') return true;
  } catch {
    // String check
    if (rawText.toLowerCase().includes('"role":"mastertrainer"') || rawText.toLowerCase().includes('"createdby":"mastertrainer"')) {
      return true;
    }
  }
  return false;
}
