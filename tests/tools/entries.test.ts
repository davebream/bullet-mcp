import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BulletClient } from "../../src/client/api.js";
import { ENTRY_FIXTURE, PAGINATED_ENTRIES } from "../fixtures/entries.js";

// Tools will be pure functions: (client, params) => result
// This makes them testable without MCP server overhead.
// Import will fail until implementation exists — that's the RED phase.
import {
	handleCreateEntry,
	handleDeleteEntry,
	handleGetEntry,
	handleListCurrent,
	handleListEntries,
	handleUpdateEntry,
} from "../../src/tools/entries.js";

function makeStubClient(overrides: Partial<BulletClient> = {}): BulletClient {
	return {
		listEntries: vi.fn().mockResolvedValue(PAGINATED_ENTRIES),
		createEntry: vi.fn().mockResolvedValue(ENTRY_FIXTURE),
		getEntry: vi.fn().mockResolvedValue(ENTRY_FIXTURE),
		updateEntry: vi
			.fn()
			.mockResolvedValue({ ...ENTRY_FIXTURE, title: "Updated" }),
		deleteEntry: vi.fn().mockResolvedValue(undefined),
		listCollections: vi.fn(),
		getCollection: vi.fn(),
		listTags: vi.fn(),
		getTag: vi.fn(),
		...overrides,
	} as unknown as BulletClient;
}

describe("entry tool handlers", () => {
	describe("handleListEntries", () => {
		it("calls client.listEntries with params and returns formatted result", async () => {
			const client = makeStubClient();
			const result = await handleListEntries(client, { view: "inbox" });

			expect(client.listEntries).toHaveBeenCalledWith({ view: "inbox" });
			expect(result).toContain(ENTRY_FIXTURE.title);
		});

		it("returns empty message when no entries found", async () => {
			const client = makeStubClient({
				listEntries: vi
					.fn()
					.mockResolvedValue({ data: [], cursor: null, has_more: false }),
			});

			const result = await handleListEntries(client, {});

			expect(result).toContain("No entries found");
		});

		it("includes pagination info when has_more is true", async () => {
			const client = makeStubClient({
				listEntries: vi.fn().mockResolvedValue({
					data: [ENTRY_FIXTURE],
					cursor: "next_cursor_123",
					has_more: true,
				}),
			});

			const result = await handleListEntries(client, {});

			expect(result).toContain("next_cursor_123");
		});
	});

	describe("handleCreateEntry", () => {
		it("calls client.createEntry and returns the created entry", async () => {
			const client = makeStubClient();
			const params = {
				title: "Buy groceries",
				kind: "task" as const,
				period: "day" as const,
			};

			const result = await handleCreateEntry(client, params);

			expect(client.createEntry).toHaveBeenCalledWith(params);
			expect(result).toContain("Buy groceries");
			expect(result).toContain(ENTRY_FIXTURE.id);
		});
	});

	describe("handleGetEntry", () => {
		it("calls client.getEntry with id", async () => {
			const client = makeStubClient();

			const result = await handleGetEntry(client, { id: ENTRY_FIXTURE.id });

			expect(client.getEntry).toHaveBeenCalledWith(ENTRY_FIXTURE.id, undefined);
			expect(result).toContain(ENTRY_FIXTURE.title);
		});

		it("passes expand parameter", async () => {
			const client = makeStubClient();

			await handleGetEntry(client, {
				id: ENTRY_FIXTURE.id,
				expand: "collection",
			});

			expect(client.getEntry).toHaveBeenCalledWith(
				ENTRY_FIXTURE.id,
				"collection",
			);
		});
	});

	describe("handleUpdateEntry", () => {
		it("calls client.updateEntry with id and title", async () => {
			const client = makeStubClient();

			const result = await handleUpdateEntry(client, {
				id: ENTRY_FIXTURE.id,
				title: "Updated",
			});

			expect(client.updateEntry).toHaveBeenCalledWith(ENTRY_FIXTURE.id, {
				title: "Updated",
			});
			expect(result).toContain("Updated");
		});
	});

	describe("handleDeleteEntry", () => {
		it("calls client.deleteEntry and confirms deletion", async () => {
			const client = makeStubClient();

			const result = await handleDeleteEntry(client, { id: ENTRY_FIXTURE.id });

			expect(client.deleteEntry).toHaveBeenCalledWith(ENTRY_FIXTURE.id);
			expect(result).toContain(ENTRY_FIXTURE.id);
		});
	});

	describe("handleListCurrent", () => {
		it("uses day period by default", async () => {
			const client = makeStubClient({
				listEntries: vi
					.fn()
					.mockResolvedValue({ data: [], cursor: null, has_more: false }),
			});

			await handleListCurrent(client, {});

			expect(client.listEntries).toHaveBeenCalledWith(
				expect.objectContaining({ period: "day" }),
			);
		});

		it("passes custom period", async () => {
			const client = makeStubClient({
				listEntries: vi
					.fn()
					.mockResolvedValue({ data: [], cursor: null, has_more: false }),
			});

			await handleListCurrent(client, { period: "week" });

			expect(client.listEntries).toHaveBeenCalledWith(
				expect.objectContaining({ period: "week" }),
			);
		});

		it("combines today's entries and overdue entries", async () => {
			const todayEntry = {
				...ENTRY_FIXTURE,
				id: "today-1",
				title: "Today task",
			};
			const overdueEntry = {
				...ENTRY_FIXTURE,
				id: "overdue-1",
				title: "Overdue task",
			};

			const client = makeStubClient({
				listEntries: vi
					.fn()
					.mockResolvedValueOnce({
						data: [todayEntry],
						cursor: null,
						has_more: false,
					})
					.mockResolvedValueOnce({
						data: [overdueEntry],
						cursor: null,
						has_more: false,
					}),
			});

			const result = await handleListCurrent(client, {});

			expect(client.listEntries).toHaveBeenCalledTimes(2);
			expect(result).toContain("Today task");
			expect(result).toContain("Overdue task");
			expect(result).toContain("Today");
			expect(result).toContain("Overdue");
		});

		it("deduplicates entries appearing in both results", async () => {
			const sharedEntry = {
				...ENTRY_FIXTURE,
				id: "shared-1",
				title: "Shared",
			};

			const client = makeStubClient({
				listEntries: vi
					.fn()
					.mockResolvedValueOnce({
						data: [sharedEntry],
						cursor: null,
						has_more: false,
					})
					.mockResolvedValueOnce({
						data: [sharedEntry],
						cursor: null,
						has_more: false,
					}),
			});

			const result = await handleListCurrent(client, {});

			const matches = result.match(/Shared/g);
			expect(matches).toHaveLength(1);
		});

		it("returns message when no entries for today", async () => {
			const client = makeStubClient({
				listEntries: vi
					.fn()
					.mockResolvedValue({ data: [], cursor: null, has_more: false }),
			});

			const result = await handleListCurrent(client, {});

			expect(result).toContain("Nothing for today.");
		});
	});
});
