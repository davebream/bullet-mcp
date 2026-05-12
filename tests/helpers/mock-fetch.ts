import { vi } from "vitest";

interface MockResponse {
	status: number;
	body?: unknown;
}

export function mockFetch(responses: MockResponse[]) {
	const calls: { url: string; init: RequestInit }[] = [];
	let callIndex = 0;

	const mock = vi.fn(
		async (input: string | URL | Request, init?: RequestInit) => {
			const url = input instanceof Request ? input.url : input.toString();
			calls.push({ url, init: init ?? {} });

			const response = responses[callIndex] ?? responses[responses.length - 1];
			callIndex++;

			return {
				ok: response.status >= 200 && response.status < 300,
				status: response.status,
				json: async () => response.body,
				text: async () => JSON.stringify(response.body),
			} as Response;
		},
	);

	vi.stubGlobal("fetch", mock);

	return {
		mock,
		calls,
		getCall: (index: number) => calls[index],
		getUrl: (index: number) => new URL(calls[index].url),
		getBody: (index: number) => JSON.parse(calls[index].init.body as string),
	};
}
