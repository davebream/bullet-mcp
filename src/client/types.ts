import type { components, operations } from "./types.generated.js";

export type Entry = components["schemas"]["Entry"];
export type Collection = components["schemas"]["Collection"];
export type Tag = components["schemas"]["Tag"];
export type CreateEntryRequest = components["schemas"]["CreateEntryRequest"];
export type UpdateEntryRequest = components["schemas"]["UpdateEntryRequest"];

export type ListEntriesParams = NonNullable<
	operations["listEntries"]["parameters"]["query"]
>;
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
