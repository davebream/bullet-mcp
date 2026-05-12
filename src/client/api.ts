import type {
	Collection,
	CreateEntryRequest,
	Entry,
	ListCollectionsParams,
	ListEntriesParams,
	ListTagsParams,
	PaginatedResponse,
	Tag,
	UpdateEntryRequest,
} from "./types.js";

const BASE_URL = "https://api.bullet.to/v1";

export class BulletApiError extends Error {
	constructor(
		public status: number,
		public body: unknown,
	) {
		super(`Bullet API error ${status}`);
		this.name = "BulletApiError";
	}
}

export class BulletClient {
	constructor(private token: string) {}

	private async request<T>(
		method: string,
		path: string,
		options?: { params?: Record<string, unknown>; body?: unknown },
	): Promise<T> {
		const url = new URL(`${BASE_URL}${path}`);

		if (options?.params) {
			for (const [key, value] of Object.entries(options.params)) {
				if (value === undefined) continue;
				if (Array.isArray(value)) {
					for (const v of value) {
						url.searchParams.append(key, String(v));
					}
				} else {
					url.searchParams.set(key, String(value));
				}
			}
		}

		const headers: Record<string, string> = {
			Authorization: `Bearer ${this.token}`,
		};
		if (options?.body) {
			headers["Content-Type"] = "application/json";
		}

		const response = await fetch(url, {
			method,
			headers,
			body: options?.body ? JSON.stringify(options.body) : undefined,
		});

		if (!response.ok) {
			const body = await response.text().catch(() => null);
			throw new BulletApiError(response.status, body);
		}

		if (response.status === 204) return undefined as T;
		return response.json() as Promise<T>;
	}

	async listEntries(
		params?: ListEntriesParams,
	): Promise<PaginatedResponse<Entry>> {
		return this.request("GET", "/entries", {
			params: params as Record<string, unknown>,
		});
	}

	async createEntry(params: CreateEntryRequest): Promise<Entry> {
		return this.request("POST", "/entries", { body: params });
	}

	async getEntry(
		id: string,
		expand?: "collection" | "tags" | ("collection" | "tags")[],
	): Promise<Entry> {
		return this.request("GET", `/entries/${id}`, {
			params: expand ? { expand } : undefined,
		});
	}

	async updateEntry(id: string, params: UpdateEntryRequest): Promise<Entry> {
		return this.request("PATCH", `/entries/${id}`, { body: params });
	}

	async deleteEntry(id: string): Promise<void> {
		return this.request("DELETE", `/entries/${id}`);
	}

	async listCollections(params?: ListCollectionsParams): Promise<Collection[]> {
		const result = await this.request<{ data: Collection[] }>(
			"GET",
			"/collections",
			{ params: params as Record<string, unknown> },
		);
		return result.data;
	}

	async getCollection(id: string): Promise<Collection> {
		return this.request("GET", `/collections/${id}`);
	}

	async listTags(params?: ListTagsParams): Promise<Tag[]> {
		const result = await this.request<{ data: Tag[] }>("GET", "/tags", {
			params: params as Record<string, unknown>,
		});
		return result.data;
	}

	async getTag(id: string): Promise<Tag> {
		return this.request("GET", `/tags/${id}`);
	}
}
