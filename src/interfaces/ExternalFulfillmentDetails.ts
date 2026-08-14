export interface ExternalFulfillmentDetails {
  /** Name of the external provider (e.g. 'Uber', 'LinkedIn', 'MercadoLibre') */
  providerName: string;
  
  /** External API transaction/payload reference ID */
  externalTransactionId: string;
  
  /** Raw REST/JSON payload constructed by the LLM-Broker */
  payload?: Record<string, unknown>;
}
