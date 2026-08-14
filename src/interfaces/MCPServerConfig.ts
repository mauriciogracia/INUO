/**
 * Configuration for an external Model Context Protocol (MCP) Server connection.
 */
export interface MCPServerConfig {
  /** Unique MCP server connection ID */
  id: string;

  /** Name of the MCP server (e.g. 'FilesystemServer', 'GitServer') */
  name: string;

  /** Command executable (e.g. 'npx', 'node') */
  command: string;

  /** Command line arguments */
  args: string[];

  /** Optional endpoint URL for HTTP SSE / WS transports */
  endpointUrl?: string;

  /** Status of connection ('Connected' | 'Disconnected' | 'Error') */
  status: 'Connected' | 'Disconnected' | 'Error';

  /** Timestamp created/connected */
  connectedAt: string;
}
