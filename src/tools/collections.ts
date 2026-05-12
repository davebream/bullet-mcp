import type { BulletClient } from "../client/api.js";
import type { ListCollectionsParams } from "../client/types.js";
import type { ToolResult } from "./definitions.js";
import { formatCollection } from "./format.js";

export async function handleListCollections(
	client: BulletClient,
	params: ListCollectionsParams,
): Promise<ToolResult> {
	const collections = await client.listCollections(params);
	const text =
		collections.length === 0
			? "No collections found."
			: collections.map(formatCollection).join("\n\n");
	return { data: { collections }, text };
}

export async function handleGetCollection(
	client: BulletClient,
	params: { id: string },
): Promise<ToolResult> {
	const collection = await client.getCollection(params.id);
	return { data: { collection }, text: formatCollection(collection) };
}
