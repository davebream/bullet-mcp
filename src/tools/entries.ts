import type { BulletClient } from "../client/api.js";
import type {
	CreateEntryRequest,
	ListEntriesParams,
	UpdateEntryRequest,
} from "../client/types.js";
import { formatEntry } from "./format.js";

export async function handleListEntries(
	client: BulletClient,
	params: ListEntriesParams,
): Promise<string> {
	const result = await client.listEntries(params);

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
	params: { id: string; expand?: "collection" | "tags" },
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
