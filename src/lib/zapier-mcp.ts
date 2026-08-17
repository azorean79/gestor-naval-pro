import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export type ZapierTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export type ZapierCallResult = {
  ok: boolean;
  text: string;
};

type ConnectedClient = {
  client: Client;
  transport: StreamableHTTPClientTransport;
};

let cached: ConnectedClient | null = null;

export function getZapierEndpoint(): string {
  const token = (process.env.ZAPIER_MCP_TOKEN || "").trim();
  const base = (process.env.ZAPIER_MCP_URL || "https://mcp.zapier.com/api/v1/connect").trim();
  if (!token) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

export function isZapierMcpConfigured(): boolean {
  return Boolean((process.env.ZAPIER_MCP_TOKEN || "").trim());
}

export async function getZapierClient(): Promise<ConnectedClient> {
  if (cached) return cached;
  if (!isZapierMcpConfigured()) {
    throw new Error("ZAPIER_MCP_TOKEN não está configurado no ambiente.");
  }
  const transport = new StreamableHTTPClientTransport(new URL(getZapierEndpoint()));
  const client = new Client({ name: "orey-azores", version: "1.0.0" });
  await client.connect(transport);
  cached = { client, transport };
  return cached;
}

export async function disconnectZapierClient(): Promise<void> {
  try {
    if (cached) {
      await cached.client.close();
    }
  } catch {
    // Ignora erros ao fechar
  } finally {
    cached = null;
  }
}

export async function listZapierTools(): Promise<ZapierTool[]> {
  const { client } = await getZapierClient();
  const res = await client.listTools();
  return (res.tools || []).map((tool) => ({
    name: tool.name,
    description: typeof tool.description === "string" ? tool.description : undefined,
    inputSchema: (tool.inputSchema as Record<string, unknown>) || undefined,
  }));
}

export async function callZapierTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ZapierCallResult> {
  const { client } = await getZapierClient();
  const res = await client.callTool({ name, arguments: args });
  const isError = Boolean((res as { isError?: boolean }).isError);
  const content = (res.content || []) as Array<{ type?: string; text?: string; [k: string]: unknown }>;
  const text = content
    .map((item) => (item && typeof item.text === "string" ? item.text : JSON.stringify(item ?? {})))
    .join("\n")
    .trim();
  return { ok: !isError && Boolean(text), text: text || JSON.stringify(res) };
}
