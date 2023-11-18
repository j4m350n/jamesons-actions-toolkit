import jobSummary from "./summary";
import { rawString, trimIndent } from "./util";

/**
 * Set the markdown job/step summary and exit immediately.
 * @param content The markdown job summary content.
 */
export function fail(content: string): never;

/**
 * Set the markdown job/step summary and exit immediately.
 * @param template The markdown job summary template  content.
 * @param args The arguments to fill into the template.
 */
export function fail(template: TemplateStringsArray, ...args: unknown[]): never;

export function fail(
	content: string | TemplateStringsArray,
	...args: unknown[]
): never {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result = "❌ Error: " + trimIndent(content as any, ...(args || []));
	jobSummary(result);
	console.error(result);
	process.exit(1);
}
