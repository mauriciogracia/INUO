import { EventEmitter } from "events";
import { InuoEventEnvelope } from "../../interfaces/InuoEventEnvelope";
import { SemanticEntity } from "../../types/SemanticEntity";
import { SemanticAction } from "../../types/SemanticAction";

export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private eventHistory: InuoEventEnvelope[] = [];
  private maxHistorySize: number = 1000;

  private constructor() {
    super();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public publish<T = any>(
    eventType: string,
    entity: SemanticEntity,
    action: SemanticAction,
    payload: T,
    sourceNodeId: string = "local_node"
  ): InuoEventEnvelope<T> {
    const envelope: InuoEventEnvelope<T> = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      entity,
      action,
      timestamp: new Date().toISOString(),
      sourceNodeId,
      payload,
    };

    this.eventHistory.push(envelope);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.emit("event", envelope);
    this.emit(eventType, envelope);
    this.emit(`${entity}.${action}`, envelope);

    return envelope;
  }

  public getHistorySince(lastEventId?: string): InuoEventEnvelope[] {
    if (!lastEventId) return [...this.eventHistory];
    const idx = this.eventHistory.findIndex((e) => e.eventId === lastEventId);
    if (idx === -1) return [...this.eventHistory];
    return this.eventHistory.slice(idx + 1);
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }
}
