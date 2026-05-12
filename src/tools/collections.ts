import type { BulletClient } from "../client/api.js";
import type { ListCollectionsParams } from "../client/types.js";
import { formatCollection } from "./format.js";

export async function handleListCollections(
	client: BulletClient,
	params: ListCollectionsParams,
): Promise<string> {
	const collections = await client.listCollections(params);

	if (collections.length === 0) return "No collections found.";

	return collections.map(formatCollection).join("\n\n");
}

export async function handleGetCollection(
	client: BulletClient,
	params: { id: string },
): Promise<string> {
	const collection = await client.getCollection(params.id);
	return formatCollection(collection);
}
