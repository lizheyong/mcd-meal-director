import { readFile } from 'node:fs/promises';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const [command = 'list', name, inputFile] = process.argv.slice(2);
if (!['list', 'schema', 'call'].includes(command) || (command !== 'list' && !name)) {
  console.error('Usage: npm run mcp -- list | schema <tool> | call <tool> [arguments.json]');
  process.exit(1);
}
if (!process.env.MCD_MCP_TOKEN) {
  console.error('Set MCD_MCP_TOKEN in your environment or in the local .env file.');
  process.exit(1);
}

const server = 'https://mcp.mcd.cn';
const client = new Client({ name: 'mcd-meal-director', version: '0.1.0' });
const transport = new StreamableHTTPClientTransport(new URL(server), {
  requestInit: { headers: { Authorization: `Bearer ${process.env.MCD_MCP_TOKEN}` } },
});

try {
  await client.connect(transport);
  let result;
  if (command === 'call') {
    const args = inputFile ? JSON.parse(await readFile(inputFile, 'utf8')) : {};
    result = await client.callTool({ name, arguments: args });
    if (result.isError) process.exitCode = 1;
  } else {
    const allTools = [];
    let cursor;
    do {
      const page = await client.listTools(cursor ? { cursor } : undefined);
      allTools.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);
    result = command === 'schema'
      ? allTools.find(tool => tool.name === name)
      : allTools.map(({ name, description }) => ({ name, description }));
    if (result === undefined) throw new Error(`Tool not found: ${name}`);
  }
  console.log(JSON.stringify({ observedAt: new Date().toISOString(), server, command, name, result }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
