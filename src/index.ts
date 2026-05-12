#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BulletClient } from "./client/api.js";
import {
	handleGetCollection,
	handleListCollections,
} from "./tools/collections.js";
import {
	createEntrySchema,
	deleteEntrySchema,
	getCollectionSchema,
	getEntrySchema,
	getTagSchema,
	listCollectionsSchema,
	listEntriesSchema,
	listTagsSchema,
	updateEntrySchema,
} from "./tools/definitions.js";
import {
	handleCreateEntry,
	handleDeleteEntry,
	handleGetEntry,
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

function textResult(text: string, isError = false) {
	return { content: [{ type: "text" as const, text }], isError };
}

async function withErrorHandling(fn: () => Promise<string>) {
	try {
		return textResult(await fn());
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return textResult(`Error: ${message}`, true);
	}
}

server.registerTool(
	"list_entries",
	{
		description:
			"List entries (tasks, notes, events) with filtering by view, period, date, status, kind, collection, or tag. Supports cursor-based pagination.",
		inputSchema: listEntriesSchema,
	},
	(params) => withErrorHandling(() => handleListEntries(client, params)),
);

server.registerTool(
	"create_entry",
	{
		description:
			"Create a new entry (task, note, or event). Omit 'start' to place it in the inbox.",
		inputSchema: createEntrySchema,
	},
	(params) => withErrorHandling(() => handleCreateEntry(client, params)),
);

server.registerTool(
	"get_entry",
	{
		description: "Retrieve a single entry by its UUID.",
		inputSchema: getEntrySchema,
	},
	(params) => withErrorHandling(() => handleGetEntry(client, params)),
);

server.registerTool(
	"update_entry",
	{
		description: "Update an entry's title.",
		inputSchema: updateEntrySchema,
	},
	(params) => withErrorHandling(() => handleUpdateEntry(client, params)),
);

server.registerTool(
	"delete_entry",
	{
		description:
			"Soft-delete an entry. Succeeds even if the entry is already deleted.",
		inputSchema: deleteEntrySchema,
		annotations: { destructiveHint: true },
	},
	(params) => withErrorHandling(() => handleDeleteEntry(client, params)),
);

server.registerTool(
	"list_collections",
	{
		description:
			"List all collections, optionally filtering by archived status.",
		inputSchema: listCollectionsSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleListCollections(client, params)),
);

server.registerTool(
	"get_collection",
	{
		description: "Retrieve a single collection by its UUID.",
		inputSchema: getCollectionSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleGetCollection(client, params)),
);

server.registerTool(
	"list_tags",
	{
		description: "List all tags, optionally filtering by archived status.",
		inputSchema: listTagsSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleListTags(client, params)),
);

server.registerTool(
	"get_tag",
	{
		description: "Retrieve a single tag by its UUID.",
		inputSchema: getTagSchema,
		annotations: { readOnlyHint: true },
	},
	(params) => withErrorHandling(() => handleGetTag(client, params)),
);

const transport = new StdioServerTransport();
await server.connect(transport);
