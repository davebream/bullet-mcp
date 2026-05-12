import { describe, expect, it, vi } from "vitest";
import type { BulletClient } from "../../src/client/api.js";
import {
	handleGetCollection,
	handleListCollections,
} from "../../src/tools/collections.js";
import { COLLECTION_FIXTURE } from "../fixtures/entries.js";

function makeStubClient(overrides: Partial<BulletClient> = {}): BulletClient {
	return {
		listEntries: vi.fn(),
		createEntry: vi.fn(),
		getEntry: vi.fn(),
		updateEntry: vi.fn(),
		deleteEntry: vi.fn(),
		listCollections: vi.fn().mockResolvedValue([COLLECTION_FIXTURE]),
		getCollection: vi.fn().mockResolvedValue(COLLECTION_FIXTURE),
		listTags: vi.fn(),
		getTag: vi.fn(),
		...overrides,
	} as unknown as BulletClient;
}

describe("collection tool handlers", () => {
	describe("handleListCollections", () => {
		it("calls client.listCollections and returns formatted result", async () => {
			const client = makeStubClient();

			const result = await handleListCollections(client, {});

			expect(client.listCollections).toHaveBeenCalledWith({});
			expect(result).toContain(COLLECTION_FIXTURE.title);
		});

		it("returns empty message when no collections", async () => {
			const client = makeStubClient({
				listCollections: vi.fn().mockResolvedValue([]),
			});

			const result = await handleListCollections(client, {});

			expect(result).toContain("No collections found");
		});

		it("passes archived filter", async () => {
			const client = makeStubClient();

			await handleListCollections(client, { archived: true });

			expect(client.listCollections).toHaveBeenCalledWith({ archived: true });
		});
	});

	describe("handleGetCollection", () => {
		it("calls client.getCollection and returns formatted result", async () => {
			const client = makeStubClient();

			const result = await handleGetCollection(client, {
				id: COLLECTION_FIXTURE.id,
			});

			expect(client.getCollection).toHaveBeenCalledWith(COLLECTION_FIXTURE.id);
			expect(result).toContain(COLLECTION_FIXTURE.title);
		});
	});
});
