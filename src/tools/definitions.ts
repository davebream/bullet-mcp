import { z } from "zod";

export const listEntriesSchema = {
	view: z
		.enum(["inbox", "overdue"])
		.optional()
		.describe(
			"Filter by view. 'inbox' shows unscheduled entries, 'overdue' shows past-due tasks.",
		),
	period: z
		.enum(["day", "week", "month", "year"])
		.optional()
		.describe("Time period granularity. Valid only without a view."),
	date: z
		.string()
		.optional()
		.describe("Date filter in YYYY-MM-DD, YYYY-MM, or YYYY format."),
	status: z
		.enum(["not_started", "completed", "cancelled"])
		.optional()
		.describe("Filter by entry status. Valid with inbox view only."),
	kind: z
		.enum(["task", "note", "event"])
		.optional()
		.describe("Filter by entry kind. Valid with inbox view only."),
	collection: z
		.string()
		.optional()
		.describe("Filter by collection UUID. Valid with overdue view only."),
	tag: z
		.string()
		.optional()
		.describe("Filter by tag UUID. Valid with overdue view only."),
	limit: z
		.number()
		.min(1)
		.max(200)
		.optional()
		.describe("Number of results to return (1-200). Default 50."),
	cursor: z
		.string()
		.optional()
		.describe("Pagination cursor from a previous response."),
	expand: z
		.enum(["collection", "tags"])
		.optional()
		.describe("Expand related objects inline."),
};

export const createEntrySchema = {
	title: z.string().min(1).max(500).describe("Entry title (1-500 characters)."),
	kind: z
		.enum(["task", "note", "event"])
		.describe("The type of entry to create."),
	start: z
		.string()
		.optional()
		.describe("ISO date or datetime for scheduling. Omit to place in inbox."),
	period: z
		.enum(["day", "week", "month", "year"])
		.optional()
		.describe("Time period granularity. Defaults to 'day'."),
	importance: z
		.number()
		.min(1)
		.max(3)
		.optional()
		.describe("Importance level (1-3)."),
};

export const getEntrySchema = {
	id: z.string().describe("Entry UUID."),
	expand: z
		.enum(["collection", "tags"])
		.optional()
		.describe("Expand related objects inline."),
};

export const updateEntrySchema = {
	id: z.string().describe("Entry UUID."),
	title: z.string().min(1).max(500).describe("New title (1-500 characters)."),
};

export const deleteEntrySchema = {
	id: z.string().describe("Entry UUID."),
};

export const listCollectionsSchema = {
	archived: z.boolean().optional().describe("Filter by archived status."),
};

export const getCollectionSchema = {
	id: z.string().describe("Collection UUID."),
};

export const listTagsSchema = {
	archived: z.boolean().optional().describe("Filter by archived status."),
};

export const getTagSchema = {
	id: z.string().describe("Tag UUID."),
};

export interface ToolDefinition {
	name: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<string, unknown>;
		required?: string[];
	};
}

function zodShapeToJsonSchema(
	shape: Record<string, z.ZodType>,
): ToolDefinition["inputSchema"] {
	const properties: Record<string, unknown> = {};
	const required: string[] = [];

	for (const [key, schema] of Object.entries(shape)) {
		const jsonSchema = schema.toJSONSchema() as Record<string, unknown>;
		properties[key] = jsonSchema;

		const isOptional = schema.isOptional();

		if (!isOptional) {
			required.push(key);
		}
	}

	return {
		type: "object",
		properties,
		...(required.length > 0 ? { required } : {}),
	};
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
	{
		name: "list_entries",
		description:
			"List entries (tasks, notes, events) with filtering by view, period, date, status, kind, collection, or tag. Supports cursor-based pagination.",
		inputSchema: zodShapeToJsonSchema(listEntriesSchema),
	},
	{
		name: "create_entry",
		description:
			"Create a new entry (task, note, or event). Omit 'start' to place it in the inbox.",
		inputSchema: zodShapeToJsonSchema(createEntrySchema),
	},
	{
		name: "get_entry",
		description: "Retrieve a single entry by its UUID.",
		inputSchema: zodShapeToJsonSchema(getEntrySchema),
	},
	{
		name: "update_entry",
		description: "Update an entry's title.",
		inputSchema: zodShapeToJsonSchema(updateEntrySchema),
	},
	{
		name: "delete_entry",
		description:
			"Soft-delete an entry. Succeeds even if the entry is already deleted.",
		inputSchema: zodShapeToJsonSchema(deleteEntrySchema),
	},
	{
		name: "list_collections",
		description:
			"List all collections, optionally filtering by archived status.",
		inputSchema: zodShapeToJsonSchema(listCollectionsSchema),
	},
	{
		name: "get_collection",
		description: "Retrieve a single collection by its UUID.",
		inputSchema: zodShapeToJsonSchema(getCollectionSchema),
	},
	{
		name: "list_tags",
		description: "List all tags, optionally filtering by archived status.",
		inputSchema: zodShapeToJsonSchema(listTagsSchema),
	},
	{
		name: "get_tag",
		description: "Retrieve a single tag by its UUID.",
		inputSchema: zodShapeToJsonSchema(getTagSchema),
	},
];
