import trimIndent from "./util/trimIndent";
import { writeFileSync } from "fs";

/**
 * Set the markdown job/step summary.
 * @param content The markdown job summary content.
 */
export function jobSummary(content: string): void;

/**
 * Set the markdown job/step summary.
 * @param template The markdown job summary template  content.
 * @param args The arguments to fill into the template.
 */
export function jobSummary(
	template: TemplateStringsArray,
	...args: unknown[]
): void;

export function jobSummary(
	content: string | TemplateStringsArray,
	...args: unknown[]
): void {
	const key = "GITHUB_STEP_SUMMARRY";
	if (!process.env[key]) {
		throw new Error(`Missing environment variable '${key}'`);
	}
	writeFileSync(
		process.env[key],
		trimIndent(
			typeof content === "string" ? content : String.raw(content, ...args),
		),
	);
}

export default jobSummary;
