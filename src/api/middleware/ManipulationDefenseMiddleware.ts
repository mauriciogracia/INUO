import { ServerResponse, IncomingMessage } from "http";
import { detectManipulationAttempt } from "../../cli/manipulationDefenseEngine";
import { EventBus } from "../events/EventBus";

export class ManipulationDefenseMiddleware {
  public static evaluate(bodyText: string, req: IncomingMessage, res: ServerResponse): boolean {
    if (!bodyText) return true;

    const evaluation = detectManipulationAttempt(bodyText, "UserInput");
    if (evaluation.isManipulative) {
      EventBus.getInstance().publish(
        "trust.penalized",
        "preference",
        "update",
        {
          reason: "Prompt injection detected via API Gateway",
          signature: evaluation.matchedPattern,
          category: evaluation.category,
        }
      );

      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Forbidden: Request blocked by Anti-Manipulation Circuit Breaker.",
          matchedPattern: evaluation.matchedPattern,
          category: evaluation.category,
          explanation: evaluation.explanation,
        })
      );
      return false;
    }

    return true;

  }
}

