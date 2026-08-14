import { getProjectPaths, loadState, saveState } from './context';
import { MCPServerConfig } from '../interfaces/MCPServerConfig';

export function runMCPCommand(args: string[], rootDir: string = process.cwd()): void {
  const sub = args[0]?.toLowerCase() || 'list';
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (sub === 'list') {
    console.log('\x1b[36m%s\x1b[0m', '=== Configured Model Context Protocol (MCP) Servers ===\n');
    const servers = state.mcpServers || [];

    if (servers.length === 0) {
      console.log('No MCP servers connected. Register one using "mcp add --name <Name> --command <Cmd> --args <A1,A2>"');
      return;
    }

    console.log(`\x1b[1m${'SERVER ID'.padEnd(20)} | ${'NAME'.padEnd(22)} | COMMAND / URL | STATUS\x1b[0m`);
    console.log(''.padEnd(80, '-'));

    servers.forEach((s) => {
      const statusColor = s.status === 'Connected' ? '\x1b[32mConnected\x1b[0m' : '\x1b[33m' + s.status + '\x1b[0m';
      const cmdStr = s.endpointUrl || `${s.command} ${s.args.join(' ')}`;
      console.log(`${s.id.padEnd(20)} | \x1b[1m${s.name.padEnd(22)}\x1b[0m | ${cmdStr.padEnd(25)} | ${statusColor}`);
    });
    return;
  }

  if (sub === 'add' || sub === 'connect') {
    let name = '';
    let command = 'npx';
    let argsInput = '';
    let endpointUrl = '';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
      if (args[i] === '--command' && args[i + 1]) command = args[i + 1];
      if (args[i] === '--args' && args[i + 1]) argsInput = args[i + 1];
      if (args[i] === '--url' && args[i + 1]) endpointUrl = args[i + 1];
    }

    if (!name && args[1] && !args[1].startsWith('-')) name = args[1];

    if (!name) {
      console.log('\x1b[33m%s\x1b[0m', 'Usage: mcp add --name <ServerName> [--command <Cmd>] [--args <Arg1,Arg2>] [--url <Url>]');
      return;
    }

    const cmdArgs = argsInput ? argsInput.split(',').map((a) => a.trim()) : [];

    const mcpServer: MCPServerConfig = {
      id: `mcp_${Date.now()}`,
      name,
      command,
      args: cmdArgs,
      endpointUrl: endpointUrl || undefined,
      status: 'Connected',
      connectedAt: new Date().toISOString(),
    };

    if (!state.mcpServers) state.mcpServers = [];
    state.mcpServers.push(mcpServer);
    saveState(paths.statePath, state);

    console.log('\x1b[32m%s\x1b[0m', `✔ Connected MCP Server: "${mcpServer.name}" [ID: ${mcpServer.id}] (Status: Connected)`);
    return;
  }

  console.log('Unknown subcommand for mcp. Supported: "mcp list", "mcp add --name <Name> --command <Cmd>"');
}
