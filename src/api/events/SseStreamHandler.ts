import { ServerResponse, IncomingMessage } from "http";
import { EventBus } from "./EventBus";
import { InuoEventEnvelope } from "../../interfaces/InuoEventEnvelope";

export class SseStreamHandler {
  public static handle(req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    res.write(`: connected to inuo event stream\n\n`);

    const bus = EventBus.getInstance();
    const lastEventId = req.headers["last-event-id"] as string | undefined;

    // Replay missed events if client reconnected with Last-Event-ID
    if (lastEventId) {
      const missed = bus.getHistorySince(lastEventId);
      for (const evt of missed) {
        SseStreamHandler.sendEvent(res, evt);
      }
    }

    const listener = (envelope: InuoEventEnvelope) => {
      SseStreamHandler.sendEvent(res, envelope);
    };

    bus.on("event", listener);

    req.on("close", () => {
      bus.removeListener("event", listener);
    });
  }

  private static sendEvent(res: ServerResponse, envelope: InuoEventEnvelope): void {
    res.write(`id: ${envelope.eventId}\n`);
    res.write(`event: ${envelope.eventType}\n`);
    res.write(`data: ${JSON.stringify(envelope)}\n\n`);
  }
}
