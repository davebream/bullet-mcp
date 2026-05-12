import type { components, operations } from "./types.generated.js";

export type Entry = components["schemas"]["Entry"];
export type Collection = components["schemas"]["Collection"];
export type Tag = components["schemas"]["Tag"];
export type CreateEntryRequest = components["schemas"]["CreateEntryRequest"];
export type UpdateEntryRequest = components["schemas"]["UpdateEntryRequest"];

export interface ListEntriesParams {
	view?: "inbox" | "overdue";
	period?: "day" | "week" | "month" | "year";
	date?: string;
	status?:
		| "not_started"
		| "completed"
		| "cancelled"
		| ("not_started" | "completed" | "cancelled")[];
	kind?: "task" | "note" | "event" | ("task" | "note" | "event")[];
	collection?: string | string[];
	tag?: string | string[];
	limit?: number;
	cursor?: string;
	expand?: "collection" | "tags" | ("collection" | "tags")[];
}
export type ListCollectionsParams = NonNullable<
	operations["listCollections"]["parameters"]["query"]
>;
export type ListTagsParams = NonNullable<
	operations["listTags"]["parameters"]["query"]
>;

export interface PaginatedResponse<T> {
	data: T[];
	cursor: string | null;
	has_more: boolean;
}
