import type {
	Collection,
	Entry,
	PaginatedResponse,
	Tag,
} from "../../src/client/types.js";

export const TAG_FIXTURE: Tag = {
	id: "t-1111-2222-3333-444444444444",
	label: "urgent",
	color: "#ff0000",
	archived: false,
};

export const COLLECTION_FIXTURE: Collection = {
	id: "c-1111-2222-3333-444444444444",
	title: "Work",
	color: "#00ff00",
	parent_id: null,
	archived: false,
};

export const ENTRY_FIXTURE: Entry = {
	id: "e-1111-2222-3333-444444444444",
	title: "Buy groceries",
	kind: "task",
	start: "2026-05-12",
	period: "day",
	importance: 2,
	status: "not_started",
	collection_id: COLLECTION_FIXTURE.id,
	tag_ids: [TAG_FIXTURE.id],
	created_at: "2026-05-12T10:00:00Z",
	updated_at: "2026-05-12T10:00:00Z",
};

export const PAGINATED_ENTRIES: PaginatedResponse<Entry> = {
	data: [ENTRY_FIXTURE],
	cursor: null,
	has_more: false,
};
