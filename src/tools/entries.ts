import type { BulletClient } from "../client/api.js";
import type { CreateEntryRequest, ListEntriesParams } from "../client/types.js";
import type { ToolResult } from "./definitions.js";
import { formatEntry } from "./format.js";

export async function handleListEntries(
	client: BulletClient,
	params: ListEntriesParams,
): Promise<ToolResult> {
	const normalized = { ...params };
	if (normalized.date && !normalized.period) {
		normalized.period = "day";
	}

	const result = await client.listEntries(normalized);

	const text =
		result.data.length === 0
			? "No entries found."
			: result.data.map(formatEntry).join("\n\n") +
				(result.has_more && result.cursor
					? `\n\nMore results available. Use cursor: ${result.cursor}`
					: "");

	return {
		data: {
			entries: result.data,
			cursor: result.cursor,
			has_more: result.has_more,
		},
		text,
	};
}

export async function handleCreateEntry(
	client: BulletClient,
	params: CreateEntryRequest,
): Promise<ToolResult> {
	const entry = await client.createEntry(params);
	return { data: { entry }, text: `Created entry:\n${formatEntry(entry)}` };
}

export async function handleGetEntry(
	client: BulletClient,
	params: {
		id: string;
		expand?: "collection" | "tags" | ("collection" | "tags")[];
	},
): Promise<ToolResult> {
	const entry = await client.getEntry(params.id, params.expand);
	return { data: { entry }, text: formatEntry(entry) };
}

export async function handleUpdateEntry(
	client: BulletClient,
	params: { id: string; title: string },
): Promise<ToolResult> {
	const entry = await client.updateEntry(params.id, { title: params.title });
	return { data: { entry }, text: `Updated entry:\n${formatEntry(entry)}` };
}

export async function handleDeleteEntry(
	client: BulletClient,
	params: { id: string },
): Promise<ToolResult> {
	await client.deleteEntry(params.id);
	return {
		data: { deleted: true, id: params.id },
		text: `Deleted entry ${params.id}.`,
	};
}

const PERIOD_LABELS: Record<string, string> = {
	day: "Today",
	week: "This week",
	month: "This month",
	year: "This year",
};

export async function handleListCurrent(
	client: BulletClient,
	params: {
		period?: "day" | "week" | "month" | "year";
		expand?: "collection" | "tags" | ("collection" | "tags")[];
	},
): Promise<ToolResult> {
	const period = params.period ?? "day";
	const label = PERIOD_LABELS[period];

	const [currentResult, overdueResult] = await Promise.all([
		client.listEntries({ period, expand: params.expand }),
		client.listEntries({ view: "overdue", expand: params.expand }),
	]);

	const seen = new Set<string>();
	const currentEntries = currentResult.data.filter((e) => {
		seen.add(e.id);
		return true;
	});
	const overdueEntries = overdueResult.data.filter((e) => !seen.has(e.id));

	const text =
		currentEntries.length === 0 && overdueEntries.length === 0
			? `Nothing for ${label.toLowerCase()}.`
			: [
					currentEntries.length > 0
						? `## ${label}\n\n${currentEntries.map(formatEntry).join("\n\n")}`
						: "",
					overdueEntries.length > 0
						? `## Overdue\n\n${overdueEntries.map(formatEntry).join("\n\n")}`
						: "",
				]
					.filter(Boolean)
					.join("\n\n");

	return {
		data: { current: currentEntries, overdue: overdueEntries, period },
		text,
	};
}
