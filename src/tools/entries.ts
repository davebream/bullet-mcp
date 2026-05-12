import type { BulletClient } from "../client/api.js";
import type { CreateEntryRequest, ListEntriesParams } from "../client/types.js";
import { formatEntry } from "./format.js";

export async function handleListEntries(
	client: BulletClient,
	params: ListEntriesParams,
): Promise<string> {
	const normalized = { ...params };
	if (normalized.date && !normalized.period) {
		normalized.period = "day";
	}

	const result = await client.listEntries(normalized);

	if (result.data.length === 0) return "No entries found.";

	const lines = result.data.map(formatEntry);
	if (result.has_more && result.cursor) {
		lines.push(`\nMore results available. Use cursor: ${result.cursor}`);
	}
	return lines.join("\n\n");
}

export async function handleCreateEntry(
	client: BulletClient,
	params: CreateEntryRequest,
): Promise<string> {
	const entry = await client.createEntry(params);
	return `Created entry:\n${formatEntry(entry)}`;
}

export async function handleGetEntry(
	client: BulletClient,
	params: {
		id: string;
		expand?: "collection" | "tags" | ("collection" | "tags")[];
	},
): Promise<string> {
	const entry = await client.getEntry(params.id, params.expand);
	return formatEntry(entry);
}

export async function handleUpdateEntry(
	client: BulletClient,
	params: { id: string; title: string },
): Promise<string> {
	const entry = await client.updateEntry(params.id, { title: params.title });
	return `Updated entry:\n${formatEntry(entry)}`;
}

export async function handleDeleteEntry(
	client: BulletClient,
	params: { id: string },
): Promise<string> {
	await client.deleteEntry(params.id);
	return `Deleted entry ${params.id}.`;
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
): Promise<string> {
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

	if (currentEntries.length === 0 && overdueEntries.length === 0) {
		return `Nothing for ${label.toLowerCase()}.`;
	}

	const sections: string[] = [];
	if (currentEntries.length > 0) {
		sections.push(
			`## ${label}\n\n${currentEntries.map(formatEntry).join("\n\n")}`,
		);
	}
	if (overdueEntries.length > 0) {
		sections.push(
			`## Overdue\n\n${overdueEntries.map(formatEntry).join("\n\n")}`,
		);
	}
	return sections.join("\n\n");
}
