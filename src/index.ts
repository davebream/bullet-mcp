#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BulletClient } from "./client/api.js";
import {
	handleGetCollection,
	handleListCollections,
} from "./tools/collections.js";
import {
	createEntryOutputSchema,
	createEntrySchema,
	deleteEntryOutputSchema,
	deleteEntrySchema,
	getCollectionOutputSchema,
	getCollectionSchema,
	getEntryOutputSchema,
	getEntrySchema,
	getTagOutputSchema,
	getTagSchema,
	listCollectionsOutputSchema,
	listCollectionsSchema,
	listCurrentOutputSchema,
	listCurrentSchema,
	listEntriesOutputSchema,
	listEntriesSchema,
	listTagsOutputSchema,
	listTagsSchema,
	updateEntryOutputSchema,
	updateEntrySchema,
} from "./tools/definitions.js";
import type { ToolResult } from "./tools/definitions.js";
import {
	handleCreateEntry,
	handleDeleteEntry,
	handleGetEntry,
	handleListCurrent,
	handleListEntries,
	handleUpdateEntry,
} from "./tools/entries.js";
import { handleGetTag, handleListTags } from "./tools/tags.js";

import spec from "../spec/openapi.json" with { type: "json" };

const API_VERSION = spec.info.version;

const token = process.env.BULLET_API_TOKEN;
if (!token) {
	console.error("BULLET_API_TOKEN environment variable is required");
	process.exit(1);
}

const client = new BulletClient(token);

const server = new McpServer({
	name: "bullet-mcp",
	version: API_VERSION,
});

async function withErrorHandling(fn: () => Promise<ToolResult>) {
	try {
		const result = await fn();
		return {
			content: [{ type: "text" as const, text: result.text }],
			structuredContent: result.data as Record<string, unknown>,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			content: [{ type: "text" as const, text: `Error: ${message}` }],
			isError: true,
		};
	}
}

server.registerTool(
	"list_entries",
	{
		description:
			"List tasks, notes, and events from Bullet. Two modes: (1) use 'view' for presets (inbox=unscheduled, overdue=past-due), or (2) use period+date for calendar queries. Each mode has different valid filters — see parameter descriptions. Returns paginated results; use cursor for next page.",
		inputSchema: listEntriesSchema,
		outputSchema: listEntriesOutputSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleListEntries(client, params)),
);

server.registerTool(
	"list_current",
	{
		description:
			"Get scheduled entries for the current period plus any overdue items. Defaults to today. Use when the user asks what's on today, this week, this month, or wants a daily/weekly overview.",
		inputSchema: listCurrentSchema,
		outputSchema: listCurrentOutputSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleListCurrent(client, params)),
);

server.registerTool(
	"create_entry",
	{
		description:
			"Create a task, note, or event in Bullet. Set 'start' to schedule it on a date/time, or omit 'start' to put it in the inbox. Tasks track completion status, notes don't, events support timezone-aware datetimes.",
		inputSchema: createEntrySchema,
		outputSchema: createEntryOutputSchema,
	},
	(params) => withErrorHandling(() => handleCreateEntry(client, params)),
);

server.registerTool(
	"get_entry",
	{
		description:
			"Get a single entry by ID with full details. Use expand to include the collection and/or tags inline instead of just IDs.",
		inputSchema: getEntrySchema,
		outputSchema: getEntryOutputSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleGetEntry(client, params)),
);

server.registerTool(
	"update_entry",
	{
		description: "Update an entry's title.",
		inputSchema: updateEntrySchema,
		outputSchema: updateEntryOutputSchema,
		annotations: { idempotentHint: true },
	},
	(params) => withErrorHandling(() => handleUpdateEntry(client, params)),
);

server.registerTool(
	"delete_entry",
	{
		description:
			"Soft-delete an entry. Idempotent — succeeds even if already deleted.",
		inputSchema: deleteEntrySchema,
		outputSchema: deleteEntryOutputSchema,
		annotations: { destructiveHint: true, idempotentHint: true },
	},
	(params) => withErrorHandling(() => handleDeleteEntry(client, params)),
);

server.registerTool(
	"list_collections",
	{
		description:
			"List all collections (folders for organizing entries). Returns IDs needed for filtering entries by collection.",
		inputSchema: listCollectionsSchema,
		outputSchema: listCollectionsOutputSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleListCollections(client, params)),
);

server.registerTool(
	"get_collection",
	{
		description: "Get a single collection by ID.",
		inputSchema: getCollectionSchema,
		outputSchema: getCollectionOutputSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleGetCollection(client, params)),
);

server.registerTool(
	"list_tags",
	{
		description:
			"List all tags (labels for categorizing entries). Returns IDs needed for filtering entries by tag.",
		inputSchema: listTagsSchema,
		outputSchema: listTagsOutputSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleListTags(client, params)),
);

server.registerTool(
	"get_tag",
	{
		description: "Get a single tag by ID.",
		inputSchema: getTagSchema,
		outputSchema: getTagOutputSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleGetTag(client, params)),
);

const transport = new StdioServerTransport();
await server.connect(transport);
