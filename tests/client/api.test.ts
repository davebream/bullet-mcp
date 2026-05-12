import { afterEach, describe, expect, it, vi } from "vitest";
import { BulletApiError, BulletClient } from "../../src/client/api.js";
import {
	COLLECTION_FIXTURE,
	ENTRY_FIXTURE,
	PAGINATED_ENTRIES,
	TAG_FIXTURE,
} from "../fixtures/entries.js";
import { mockFetch } from "../helpers/mock-fetch.js";

const TOKEN = "blt_test_token_123";

describe("BulletClient", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("authentication", () => {
		it("sends Bearer token in Authorization header", async () => {
			const { mock } = mockFetch([{ status: 200, body: PAGINATED_ENTRIES }]);
			const client = new BulletClient(TOKEN);

			await client.listEntries();

			const headers = mock.mock.calls[0][1]?.headers as Record<string, string>;
			expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
		});
	});

	describe("listEntries", () => {
		it("GETs /entries with no params", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: PAGINATED_ENTRIES }]);
			const client = new BulletClient(TOKEN);

			const result = await client.listEntries();

			expect(getUrl(0).pathname).toBe("/v1/entries");
			expect(result).toEqual(PAGINATED_ENTRIES);
		});

		it("passes view parameter", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: PAGINATED_ENTRIES }]);
			const client = new BulletClient(TOKEN);

			await client.listEntries({ view: "inbox" });

			expect(getUrl(0).searchParams.get("view")).toBe("inbox");
		});

		it("passes period and date parameters", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: PAGINATED_ENTRIES }]);
			const client = new BulletClient(TOKEN);

			await client.listEntries({ period: "week", date: "2026-05-12" });

			const params = getUrl(0).searchParams;
			expect(params.get("period")).toBe("week");
			expect(params.get("date")).toBe("2026-05-12");
		});

		it("passes limit and cursor for pagination", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: PAGINATED_ENTRIES }]);
			const client = new BulletClient(TOKEN);

			await client.listEntries({ limit: 10, cursor: "abc123" });

			const params = getUrl(0).searchParams;
			expect(params.get("limit")).toBe("10");
			expect(params.get("cursor")).toBe("abc123");
		});

		it("serializes array params as repeated keys", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: PAGINATED_ENTRIES }]);
			const client = new BulletClient(TOKEN);

			await client.listEntries({
				status: ["not_started", "completed"],
				kind: ["task", "note"],
			});

			const params = getUrl(0).searchParams;
			expect(params.getAll("status")).toEqual(["not_started", "completed"]);
			expect(params.getAll("kind")).toEqual(["task", "note"]);
		});

		it("omits undefined params", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: PAGINATED_ENTRIES }]);
			const client = new BulletClient(TOKEN);

			await client.listEntries({ view: "inbox" });

			const params = getUrl(0).searchParams;
			expect(params.has("period")).toBe(false);
			expect(params.has("date")).toBe(false);
		});
	});

	describe("createEntry", () => {
		it("POSTs to /entries with body", async () => {
			const { getUrl, getBody, mock } = mockFetch([
				{ status: 201, body: ENTRY_FIXTURE },
			]);
			const client = new BulletClient(TOKEN);

			const result = await client.createEntry({
				title: "Buy groceries",
				kind: "task",
				period: "day",
			});

			expect(mock.mock.calls[0][1]?.method).toBe("POST");
			expect(getUrl(0).pathname).toBe("/v1/entries");
			expect(getBody(0)).toEqual({
				title: "Buy groceries",
				kind: "task",
				period: "day",
			});
			expect(result).toEqual(ENTRY_FIXTURE);
		});

		it("includes optional fields when provided", async () => {
			const { getBody } = mockFetch([{ status: 201, body: ENTRY_FIXTURE }]);
			const client = new BulletClient(TOKEN);

			await client.createEntry({
				title: "Meeting",
				kind: "event",
				start: "2026-05-15T14:00:00Z",
				period: "day",
				importance: 3,
			});

			const body = getBody(0);
			expect(body.start).toBe("2026-05-15T14:00:00Z");
			expect(body.importance).toBe(3);
		});
	});

	describe("getEntry", () => {
		it("GETs /entries/:id", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: ENTRY_FIXTURE }]);
			const client = new BulletClient(TOKEN);

			const result = await client.getEntry(ENTRY_FIXTURE.id);

			expect(getUrl(0).pathname).toBe(`/v1/entries/${ENTRY_FIXTURE.id}`);
			expect(result).toEqual(ENTRY_FIXTURE);
		});

		it("passes expand parameter", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: ENTRY_FIXTURE }]);
			const client = new BulletClient(TOKEN);

			await client.getEntry(ENTRY_FIXTURE.id, "collection");

			expect(getUrl(0).searchParams.get("expand")).toBe("collection");
		});

		it("passes expand as array of repeated params", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: ENTRY_FIXTURE }]);
			const client = new BulletClient(TOKEN);

			await client.getEntry(ENTRY_FIXTURE.id, ["collection", "tags"]);

			const params = getUrl(0).searchParams;
			expect(params.getAll("expand")).toEqual(["collection", "tags"]);
		});
	});

	describe("updateEntry", () => {
		it("PATCHes /entries/:id with body", async () => {
			const updated = { ...ENTRY_FIXTURE, title: "Updated title" };
			const { getUrl, getBody, mock } = mockFetch([
				{ status: 200, body: updated },
			]);
			const client = new BulletClient(TOKEN);

			const result = await client.updateEntry(ENTRY_FIXTURE.id, {
				title: "Updated title",
			});

			expect(mock.mock.calls[0][1]?.method).toBe("PATCH");
			expect(getUrl(0).pathname).toBe(`/v1/entries/${ENTRY_FIXTURE.id}`);
			expect(getBody(0)).toEqual({ title: "Updated title" });
			expect(result.title).toBe("Updated title");
		});
	});

	describe("deleteEntry", () => {
		it("DELETEs /entries/:id and returns void", async () => {
			const { getUrl, mock } = mockFetch([{ status: 204 }]);
			const client = new BulletClient(TOKEN);

			const result = await client.deleteEntry(ENTRY_FIXTURE.id);

			expect(mock.mock.calls[0][1]?.method).toBe("DELETE");
			expect(getUrl(0).pathname).toBe(`/v1/entries/${ENTRY_FIXTURE.id}`);
			expect(result).toBeUndefined();
		});
	});

	describe("listCollections", () => {
		it("GETs /collections", async () => {
			const { getUrl } = mockFetch([
				{ status: 200, body: { data: [COLLECTION_FIXTURE] } },
			]);
			const client = new BulletClient(TOKEN);

			const result = await client.listCollections();

			expect(getUrl(0).pathname).toBe("/v1/collections");
			expect(result).toEqual([COLLECTION_FIXTURE]);
		});

		it("passes archived filter", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: { data: [] } }]);
			const client = new BulletClient(TOKEN);

			await client.listCollections({ archived: true });

			expect(getUrl(0).searchParams.get("archived")).toBe("true");
		});
	});

	describe("getCollection", () => {
		it("GETs /collections/:id", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: COLLECTION_FIXTURE }]);
			const client = new BulletClient(TOKEN);

			const result = await client.getCollection(COLLECTION_FIXTURE.id);

			expect(getUrl(0).pathname).toBe(
				`/v1/collections/${COLLECTION_FIXTURE.id}`,
			);
			expect(result).toEqual(COLLECTION_FIXTURE);
		});
	});

	describe("listTags", () => {
		it("GETs /tags", async () => {
			const { getUrl } = mockFetch([
				{ status: 200, body: { data: [TAG_FIXTURE] } },
			]);
			const client = new BulletClient(TOKEN);

			const result = await client.listTags();

			expect(getUrl(0).pathname).toBe("/v1/tags");
			expect(result).toEqual([TAG_FIXTURE]);
		});

		it("passes archived filter", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: { data: [] } }]);
			const client = new BulletClient(TOKEN);

			await client.listTags({ archived: false });

			expect(getUrl(0).searchParams.get("archived")).toBe("false");
		});
	});

	describe("getTag", () => {
		it("GETs /tags/:id", async () => {
			const { getUrl } = mockFetch([{ status: 200, body: TAG_FIXTURE }]);
			const client = new BulletClient(TOKEN);

			const result = await client.getTag(TAG_FIXTURE.id);

			expect(getUrl(0).pathname).toBe(`/v1/tags/${TAG_FIXTURE.id}`);
			expect(result).toEqual(TAG_FIXTURE);
		});
	});

	describe("error handling", () => {
		it("throws BulletApiError on non-2xx response", async () => {
			mockFetch([{ status: 404, body: { error: "Not found" } }]);
			const client = new BulletClient(TOKEN);

			await expect(client.getEntry("nonexistent")).rejects.toThrow(
				BulletApiError,
			);
		});

		it("includes status code in error", async () => {
			mockFetch([{ status: 422, body: { error: "Validation failed" } }]);
			const client = new BulletClient(TOKEN);

			try {
				await client.createEntry({ title: "", kind: "task", period: "day" });
			} catch (err) {
				expect(err).toBeInstanceOf(BulletApiError);
				expect((err as BulletApiError).status).toBe(422);
			}
		});

		it("throws on 401 unauthorized", async () => {
			mockFetch([{ status: 401, body: { error: "Unauthorized" } }]);
			const client = new BulletClient("blt_invalid");

			await expect(client.listEntries()).rejects.toThrow(BulletApiError);
		});
	});
});
