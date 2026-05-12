import type { BulletClient } from "../client/api.js";
import type { ListTagsParams } from "../client/types.js";
import type { ToolResult } from "./definitions.js";
import { formatTag } from "./format.js";

export async function handleListTags(
	client: BulletClient,
	params: ListTagsParams,
): Promise<ToolResult> {
	const tags = await client.listTags(params);
	const text =
		tags.length === 0 ? "No tags found." : tags.map(formatTag).join("\n\n");
	return { data: { tags }, text };
}

export async function handleGetTag(
	client: BulletClient,
	params: { id: string },
): Promise<ToolResult> {
	const tag = await client.getTag(params.id);
	return { data: { tag }, text: formatTag(tag) };
}
