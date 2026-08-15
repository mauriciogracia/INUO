import {
  getCostGovernanceConfig,
  grantPaidTierConsent,
  selectPaidModelWithConsent,
  setTierModel,
  resetFreeTierStatus,
  getActiveTierModel,
  addModelToPool,
  removeModelFromPool,
} from "./costGovernanceEngine";
import { getProjectPaths, loadState } from "./context";
import { getI18n } from "../i18n";
import { writeOutput } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";

export function runTierCommand(
  args: string[],
  rootDir: string = process.cwd(),
): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const lang = state.operatingMode?.detectedLanguage || "es";
  const dict = getI18n(lang);

  const sub = (args[0] || "status").toLowerCase();

  switch (sub) {
    case "status": {
      const config = getCostGovernanceConfig(rootDir);
      const active = getActiveTierModel(rootDir);
      const lines = [
        dict.costGovernance.tierStatusHeader,
        `• Tier Mode: ${config.tierMode}`,
        `• Free Tier Status: ${config.freeTierStatus}`,
        `• Free Pool Candidates (${config.freeModelsPool?.length || 0}): ${(config.freeModelsPool || []).join(", ")}`,
        `• Currently Exhausted Free Models: ${(config.exhaustedFreeModels?.length ? config.exhaustedFreeModels.join(", ") : "None")}`,
        `• Paid Pool Candidates (${config.paidModelsPool?.length || 0}): ${(config.paidModelsPool || []).join(", ")}`,
        `• Paid Model Consent: ${config.paidTierConsent ? `GRANTED (${config.selectedPaidModel || config.preferredPaidModel})` : "REVOKED / PENDING (Blocked)"}`,
        `• Currently Active Model: ${active.model} (${active.isPaid ? "PAID" : "FREE"})`,
      ];
      writeOutput(OutputChannelEnum.USER_REPLY, lines.join("\n"));
      break;
    }

    case "select": {
      const modelName = args[1];
      if (modelName) {
        selectPaidModelWithConsent(modelName, lang, rootDir);
      } else {
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          "Usage: tier select <paidModelName>",
        );
      }
      break;
    }

    case "consent": {
      const val = (args[1] || "").toLowerCase();
      if (
        val === "yes" ||
        val === "true" ||
        val === "allow" ||
        val === "si" ||
        val === "sí"
      ) {
        const targetPaid = args[2] || undefined;
        if (targetPaid) {
          selectPaidModelWithConsent(targetPaid, lang, rootDir);
        } else {
          grantPaidTierConsent(true, lang, rootDir);
        }
      } else if (
        val === "no" ||
        val === "false" ||
        val === "deny" ||
        val === "revoke"
      ) {
        grantPaidTierConsent(false, lang, rootDir);
      } else {
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          "Usage: tier consent [yes|no] [optionalModelName]",
        );
      }
      break;
    }

    case "free-pool":
    case "freepool": {
      const action = (args[1] || "list").toLowerCase();
      const model = args[2];
      if (action === "add" && model) {
        addModelToPool("free", model, rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `✔ Added "${model}" to free models pool.`,
        );
      } else if (action === "remove" && model) {
        removeModelFromPool("free", model, rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `✔ Removed "${model}" from free models pool.`,
        );
      } else {
        const config = getCostGovernanceConfig(rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `Free Models Pool: ${(config.freeModelsPool || []).join(", ")}`,
        );
      }
      break;
    }

    case "paid-pool":
    case "paidpool": {
      const action = (args[1] || "list").toLowerCase();
      const model = args[2];
      if (action === "add" && model) {
        addModelToPool("paid", model, rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `✔ Added "${model}" to paid models pool.`,
        );
      } else if (action === "remove" && model) {
        removeModelFromPool("paid", model, rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `✔ Removed "${model}" from paid models pool.`,
        );
      } else {
        const config = getCostGovernanceConfig(rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `Paid Models Pool: ${(config.paidModelsPool || []).join(", ")}`,
        );
      }
      break;
    }

    case "model": {
      const tierType = (args[1] || "").toLowerCase();
      const modelName = args[2];
      if ((tierType === "free" || tierType === "paid") && modelName) {
        setTierModel(tierType, modelName, rootDir);
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          `✔ Configured ${tierType} tier preferred model to "${modelName}".`,
        );
      } else {
        writeOutput(
          OutputChannelEnum.USER_REPLY,
          "Usage: tier model <free|paid> <modelName>",
        );
      }
      break;
    }

    case "reset": {
      resetFreeTierStatus(rootDir);
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        "✔ Reset free tier status and cleared exhausted pool. Operating on primary free model.",
      );
      break;
    }

    default:
      writeOutput(
        OutputChannelEnum.USER_REPLY,
        "Usage: tier [status | select <model> | consent yes/no | free-pool add/remove/list | paid-pool add/remove/list | reset]",
      );
      break;
  }
}
