import type { BulletClient } from "../client/api.js";
import type { ListTagsParams } from "../client/types.js";
import { formatTag } from "./format.js";

export async function handleListTags(
	client: BulletClient,
	params: ListTagsParams,
): Promise<string> {
	const tags = await client.listTags(params);

	if (tags.length === 0) return "No tags found.";

	return tags.map(formatTag).join("\n\n");
}

export async function handleGetTag(
	client: BulletClient,
	params: { id: string },
): Promise<string> {
	const tag = await client.getTag(params.id);
	return formatTag(tag);
}
