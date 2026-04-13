#!/usr/bin/env node
/**
 * Music Analytics MCP Server
 *
 * Provides access to artist analytics data via MCP protocol.
 * Connects to the REST API at artist-analytics.pages.dev.
 *
 * Usage:
 *   MUSIC_ANALYTICS_API=https://artist-analytics.pages.dev npx tsx mcp/src/index.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE =
  process.env.MUSIC_ANALYTICS_API || "https://artist-analytics.pages.dev";

async function apiFetch(path: string): Promise<unknown> {
  const url = `${API_BASE}${path}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`API error ${resp.status}: ${body}`);
  }
  return resp.json();
}

// ── Server setup ──

const server = new McpServer({
  name: "music-analytics",
  version: "0.1.0",
});

// ── Tool: get_artist_data ──

server.tool(
  "get_artist_data",
  "Get complete data for an artist including records, annotations, buzz events, metadata, and song performance",
  { artist_id: z.string().describe("Artist ID (e.g., 'yoasobi', 'king-gnu')") },
  async ({ artist_id }) => {
    const data = await apiFetch(`/api/artists/${encodeURIComponent(artist_id)}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// ── Tool: list_artists ──

server.tool(
  "list_artists",
  "List all tracked artists, optionally filtered by region",
  { region: z.enum(["jp", "global"]).optional().describe("Filter by region: 'jp' or 'global'") },
  async ({ region }) => {
    const path = region ? `/api/artists?region=${region}` : "/api/artists";
    const data = await apiFetch(path);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// ── Tool: get_buzz_events ──

server.tool(
  "get_buzz_events",
  "Get buzz events (unusual metric spikes) for an artist. Types: 'annotated' (linked to news), 'organic' (unexplained, most valuable), 'seasonal' (yearly pattern)",
  {
    artist_id: z.string().describe("Artist ID"),
    type: z.enum(["annotated", "organic", "seasonal"]).optional().describe("Filter by buzz type"),
  },
  async ({ artist_id, type }) => {
    let path = `/api/artists/${encodeURIComponent(artist_id)}/buzz`;
    if (type) path += `?type=${type}`;
    const data = await apiFetch(path);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// ── Tool: get_annotations ──

server.tool(
  "get_annotations",
  "Get news annotations (releases, tours, viral events, etc.) for an artist",
  {
    artist_id: z.string().describe("Artist ID"),
    category: z
      .enum(["release", "viral", "collab", "tour", "award", "other"])
      .optional()
      .describe("Filter by category"),
  },
  async ({ artist_id, category }) => {
    let path = `/api/artists/${encodeURIComponent(artist_id)}/annotations`;
    if (category) path += `?category=${category}`;
    const data = await apiFetch(path);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// ── Tool: search_artists ──

server.tool(
  "search_artists",
  "Search for artists by name (partial match)",
  { query: z.string().describe("Search query (artist name)") },
  async ({ query }) => {
    const data = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// ── Start server ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
