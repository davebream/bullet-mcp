import { z } from "zod";

export const listEntriesSchema = {
	view: z
		.enum(["inbox", "overdue"])
		.optional()
		.describe(
			"Preset view. 'inbox' = unscheduled entries (supports status, kind filters). 'overdue' = past-due tasks (supports collection, tag filters). Omit to query by period/date instead.",
		),
	period: z
		.enum(["day", "week", "month", "year"])
		.optional()
		.describe(
			"Time granularity for date-based queries. Cannot be used with a view. If date is set, period controls its scope (day=single day, week=that week, etc). Defaults date to now if omitted.",
		),
	date: z
		.string()
		.optional()
		.describe(
			"Anchor date for period queries. Format must match period: YYYY-MM-DD for day/week, YYYY-MM for month, YYYY for year. Defaults to current date if omitted. Cannot be used with a view.",
		),
	status: z
		.union([
			z.enum(["not_started", "completed", "cancelled"]),
			z.array(z.enum(["not_started", "completed", "cancelled"])),
		])
		.optional()
		.describe(
			"Filter by task status. Pass an array to match any. Works with view=inbox or without a view. Not valid with view=overdue.",
		),
	kind: z
		.union([
			z.enum(["task", "note", "event"]),
			z.array(z.enum(["task", "note", "event"])),
		])
		.optional()
		.describe(
			"Filter by entry type. Pass an array to match any. Works with view=inbox or without a view. Not valid with view=overdue.",
		),
	collection: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.describe(
			"Filter by collection ID. Pass an array to match any. Works with view=overdue or without a view. Not valid with view=inbox. Use list_collections to find IDs.",
		),
	tag: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.describe(
			"Filter by tag ID. Pass an array to match any. Works with view=overdue or without a view. Not valid with view=inbox. Use list_tags to find IDs.",
		),
	limit: z
		.number()
		.min(1)
		.max(200)
		.optional()
		.describe("Max entries to return (1-200, default 50)."),
	cursor: z
		.string()
		.optional()
		.describe(
			"Pagination cursor from a previous list_entries response. Pass this to get the next page.",
		),
	expand: z
		.union([
			z.enum(["collection", "tags"]),
			z.array(z.enum(["collection", "tags"])),
		])
		.optional()
		.describe(
			"Include related objects in the response. 'collection' inlines the collection object, 'tags' inlines tag objects. Pass an array for both.",
		),
};

export const createEntrySchema = {
	title: z.string().min(1).max(500).describe("Entry title (1-500 characters)."),
	kind: z
		.enum(["task", "note", "event"])
		.describe("Entry type: task (has status), note (no status), or event."),
	start: z
		.string()
		.optional()
		.describe(
			"When this entry is scheduled. Omit to place in inbox. Accepts: YYYY-MM-DD (date), YYYY-MM (month), YYYY (year), or ISO 8601 datetime with timezone for events. The period parameter controls how date-only values are interpreted.",
		),
	period: z
		.enum(["day", "week", "month", "year"])
		.optional()
		.describe(
			"Schedule granularity. Controls how a date-only 'start' is interpreted: 'day' = that specific day, 'week' = the week containing that date, etc. Defaults to 'day'. Only meaningful when 'start' is set.",
		),
	importance: z
		.number()
		.min(1)
		.max(3)
		.optional()
		.describe(
			"Priority level: 1 = low, 2 = medium, 3 = high. Omit for default.",
		),
};

export const getEntrySchema = {
	id: z.string().describe("Entry ID (UUID). Get IDs from list_entries."),
	expand: z
		.union([
			z.enum(["collection", "tags"]),
			z.array(z.enum(["collection", "tags"])),
		])
		.optional()
		.describe(
			"Include related objects. 'collection' inlines the collection, 'tags' inlines tags. Pass an array for both.",
		),
};

export const updateEntrySchema = {
	id: z.string().describe("Entry ID (UUID) to update."),
	title: z.string().min(1).max(500).describe("New title (1-500 characters)."),
};

export const deleteEntrySchema = {
	id: z
		.string()
		.describe("Entry ID (UUID) to delete. Succeeds even if already deleted."),
};

export const listCurrentSchema = {
	period: z
		.enum(["day", "week", "month", "year"])
		.optional()
		.describe(
			"Time scope. 'day' = today, 'week' = this week, 'month' = this month, 'year' = this year. Defaults to 'day'.",
		),
	expand: z
		.union([
			z.enum(["collection", "tags"]),
			z.array(z.enum(["collection", "tags"])),
		])
		.optional()
		.describe(
			"Include related objects. 'collection' inlines the collection, 'tags' inlines tags. Pass an array for both.",
		),
};

export const listCollectionsSchema = {
	archived: z
		.boolean()
		.optional()
		.describe(
			"Filter by archived status. true = only archived, false = only active, omit = all.",
		),
};

export const getCollectionSchema = {
	id: z
		.string()
		.describe("Collection ID (UUID). Get IDs from list_collections."),
};

export const listTagsSchema = {
	archived: z
		.boolean()
		.optional()
		.describe(
			"Filter by archived status. true = only archived, false = only active, omit = all.",
		),
};

export const getTagSchema = {
	id: z.string().describe("Tag ID (UUID). Get IDs from list_tags."),
};

export interface ToolResult<T = unknown> {
	data: T;
	text: string;
}

export const entrySchema = z.object({
	id: z.string(),
	title: z.string(),
	kind: z.enum(["task", "note", "event"]),
	start: z.string().nullable(),
	period: z.enum(["day", "week", "month", "year"]).nullable(),
	importance: z.number().nullable(),
	status: z.string().nullable(),
	collection_id: z.string().nullable(),
	tag_ids: z.array(z.string()),
	created_at: z.string(),
	updated_at: z.string(),
});

export const collectionSchema = z.object({
	id: z.string(),
	title: z.string(),
	color: z.string().nullable(),
	parent_id: z.string().nullable(),
	archived: z.boolean(),
});

export const tagSchema = z.object({
	id: z.string(),
	label: z.string(),
	color: z.string().nullable(),
	archived: z.boolean(),
});

export const listEntriesOutputSchema = {
	entries: z.array(entrySchema),
	cursor: z.string().nullable(),
	has_more: z.boolean(),
};

export const createEntryOutputSchema = { entry: entrySchema };
export const getEntryOutputSchema = { entry: entrySchema };
export const updateEntryOutputSchema = { entry: entrySchema };
export const deleteEntryOutputSchema = {
	deleted: z.boolean(),
	id: z.string(),
};

export const listCurrentOutputSchema = {
	current: z.array(entrySchema),
	overdue: z.array(entrySchema),
	period: z.string(),
};

export const listCollectionsOutputSchema = {
	collections: z.array(collectionSchema),
};
export const getCollectionOutputSchema = { collection: collectionSchema };

export const listTagsOutputSchema = { tags: z.array(tagSchema) };
export const getTagOutputSchema = { tag: tagSchema };

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
			"List tasks, notes, and events from Bullet. Two modes: (1) use 'view' for presets (inbox=unscheduled, overdue=past-due), or (2) use period+date for calendar queries. Each mode has different valid filters — see parameter descriptions. Returns paginated results; use cursor for next page.",
		inputSchema: zodShapeToJsonSchema(listEntriesSchema),
	},
	{
		name: "list_current",
		description:
			"Get scheduled entries for the current period plus any overdue items. Defaults to today. Use when the user asks what's on today, this week, this month, or wants a daily/weekly overview.",
		inputSchema: zodShapeToJsonSchema(listCurrentSchema),
	},
	{
		name: "create_entry",
		description:
			"Create a task, note, or event in Bullet. Set 'start' to schedule it on a date/time, or omit 'start' to put it in the inbox. Tasks track completion status, notes don't, events support timezone-aware datetimes.",
		inputSchema: zodShapeToJsonSchema(createEntrySchema),
	},
	{
		name: "get_entry",
		description:
			"Get a single entry by ID with full details. Use expand to include the collection and/or tags inline instead of just IDs.",
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
			"Soft-delete an entry. Idempotent — succeeds even if already deleted.",
		inputSchema: zodShapeToJsonSchema(deleteEntrySchema),
	},
	{
		name: "list_collections",
		description:
			"List all collections (folders for organizing entries). Returns IDs needed for filtering entries by collection.",
		inputSchema: zodShapeToJsonSchema(listCollectionsSchema),
	},
	{
		name: "get_collection",
		description: "Get a single collection by ID.",
		inputSchema: zodShapeToJsonSchema(getCollectionSchema),
	},
	{
		name: "list_tags",
		description:
			"List all tags (labels for categorizing entries). Returns IDs needed for filtering entries by tag.",
		inputSchema: zodShapeToJsonSchema(listTagsSchema),
	},
	{
		name: "get_tag",
		description: "Get a single tag by ID.",
		inputSchema: zodShapeToJsonSchema(getTagSchema),
	},
];
