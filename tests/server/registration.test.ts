import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { ToolDefinition } from "../../src/tools/definitions.js";
import { TOOL_DEFINITIONS } from "../../src/tools/definitions.js";

// biome-ignore lint/suspicious/noExplicitAny: OpenAPI spec is untyped JSON
const spec: any = JSON.parse(
	readFileSync(resolve(__dirname, "../../spec/openapi.json"), "utf-8"),
);

function findTool(name: string): ToolDefinition {
	const tool = TOOL_DEFINITIONS.find((t) => t.name === name);
	if (!tool) throw new Error(`Tool ${name} not found`);
	return tool;
}

function getProperty(
	tool: ToolDefinition,
	key: string,
): Record<string, unknown> {
	return (
		tool.inputSchema.properties as Record<string, Record<string, unknown>>
	)[key];
}

describe("MCP tool definitions align with OpenAPI spec", () => {
	it("every tool has a name and description", () => {
		for (const tool of TOOL_DEFINITIONS) {
			expect(tool.name).toBeTruthy();
			expect(tool.description).toBeTruthy();
			expect(tool.description.length).toBeGreaterThan(10);
		}
	});

	it("every tool has an inputSchema with type object", () => {
		for (const tool of TOOL_DEFINITIONS) {
			expect(tool.inputSchema.type).toBe("object");
			expect(tool.inputSchema.properties).toBeDefined();
		}
	});

	it("list_entries tool has params matching GET /entries query params", () => {
		const tool = findTool("list_entries");
		const specParams = spec.paths["/entries"].get.parameters.map(
			(p: { name: string }) => p.name,
		);
		const toolProps = Object.keys(tool.inputSchema.properties);

		for (const param of specParams) {
			expect(toolProps).toContain(param);
		}
	});

	it("create_entry tool requires title and kind (matching spec)", () => {
		const tool = findTool("create_entry");
		expect(tool.inputSchema.required).toContain("title");
		expect(tool.inputSchema.required).toContain("kind");
	});

	it("create_entry tool kind enum matches spec", () => {
		const tool = findTool("create_entry");
		const specEnum =
			spec.components.schemas.CreateEntryRequest.properties.kind.enum;
		expect(getProperty(tool, "kind").enum).toEqual(specEnum);
	});

	it("list_entries tool view enum matches spec", () => {
		const tool = findTool("list_entries");
		const specEnum = spec.paths["/entries"].get.parameters.find(
			(p: { name: string }) => p.name === "view",
		).schema.enum;
		expect(getProperty(tool, "view").enum).toEqual(specEnum);
	});

	it("defines tools for all API resource groups", () => {
		const toolNames = TOOL_DEFINITIONS.map((t) => t.name);
		expect(toolNames).toContain("list_entries");
		expect(toolNames).toContain("create_entry");
		expect(toolNames).toContain("get_entry");
		expect(toolNames).toContain("update_entry");
		expect(toolNames).toContain("delete_entry");
		expect(toolNames).toContain("list_collections");
		expect(toolNames).toContain("get_collection");
		expect(toolNames).toContain("list_tags");
		expect(toolNames).toContain("get_tag");
	});

	it("get_entry requires id parameter", () => {
		expect(findTool("get_entry").inputSchema.required).toContain("id");
	});

	it("delete_entry requires id parameter", () => {
		expect(findTool("delete_entry").inputSchema.required).toContain("id");
	});

	it("update_entry requires id and title", () => {
		const tool = findTool("update_entry");
		expect(tool.inputSchema.required).toContain("id");
		expect(tool.inputSchema.required).toContain("title");
	});
});
