import { describe, expect, it, vi } from "vitest";
import type { BulletClient } from "../../src/client/api.js";
import { handleGetTag, handleListTags } from "../../src/tools/tags.js";
import { TAG_FIXTURE } from "../fixtures/entries.js";

function makeStubClient(overrides: Partial<BulletClient> = {}): BulletClient {
	return {
		listEntries: vi.fn(),
		createEntry: vi.fn(),
		getEntry: vi.fn(),
		updateEntry: vi.fn(),
		deleteEntry: vi.fn(),
		listCollections: vi.fn(),
		getCollection: vi.fn(),
		listTags: vi.fn().mockResolvedValue([TAG_FIXTURE]),
		getTag: vi.fn().mockResolvedValue(TAG_FIXTURE),
		...overrides,
	} as unknown as BulletClient;
}

describe("tag tool handlers", () => {
	describe("handleListTags", () => {
		it("calls client.listTags and returns formatted result", async () => {
			const client = makeStubClient();

			const result = await handleListTags(client, {});

			expect(client.listTags).toHaveBeenCalledWith({});
			expect(result.text).toContain(TAG_FIXTURE.label);
		});

		it("returns empty message when no tags", async () => {
			const client = makeStubClient({
				listTags: vi.fn().mockResolvedValue([]),
			});

			const result = await handleListTags(client, {});

			expect(result.text).toContain("No tags found");
		});

		it("passes archived filter", async () => {
			const client = makeStubClient();

			await handleListTags(client, { archived: false });

			expect(client.listTags).toHaveBeenCalledWith({ archived: false });
		});
	});

	describe("handleGetTag", () => {
		it("calls client.getTag and returns formatted result", async () => {
			const client = makeStubClient();

			const result = await handleGetTag(client, { id: TAG_FIXTURE.id });

			expect(client.getTag).toHaveBeenCalledWith(TAG_FIXTURE.id);
			expect(result.text).toContain(TAG_FIXTURE.label);
		});
	});
});
