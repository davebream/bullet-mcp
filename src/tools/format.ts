import type { Collection, Entry, Tag } from "../client/types.js";

export function formatEntry(entry: Entry): string {
	const parts = [`[${entry.kind}] ${entry.title}`, `  id: ${entry.id}`];
	if (entry.status != null) parts.push(`  status: ${entry.status}`);
	if (entry.start) parts.push(`  start: ${entry.start}`);
	if (entry.period) parts.push(`  period: ${entry.period}`);
	if (entry.importance) parts.push(`  importance: ${entry.importance}`);
	if (entry.collection_id)
		parts.push(`  collection_id: ${entry.collection_id}`);
	if (entry.collection) parts.push(`  collection: ${entry.collection.title}`);
	if (entry.tag_ids?.length)
		parts.push(`  tag_ids: ${entry.tag_ids.join(", ")}`);
	if (entry.tags?.length)
		parts.push(`  tags: ${entry.tags.map((t) => t.label).join(", ")}`);
	return parts.join("\n");
}

export function formatCollection(collection: Collection): string {
	const parts = [collection.title, `  id: ${collection.id}`];
	if (collection.color) parts.push(`  color: ${collection.color}`);
	if (collection.parent_id) parts.push(`  parent_id: ${collection.parent_id}`);
	parts.push(`  archived: ${collection.archived}`);
	return parts.join("\n");
}

export function formatTag(tag: Tag): string {
	const parts = [tag.label, `  id: ${tag.id}`];
	if (tag.color) parts.push(`  color: ${tag.color}`);
	parts.push(`  archived: ${tag.archived}`);
	return parts.join("\n");
}
