import { writeFile } from "fs/promises";

/**
 * Set the markdown job/step summary.
 * @param content The markdown job summary content.
 */
export async function jobSummary(content: string): Promise<void>;

/**
 * Set the markdown job/step summary.
 * @param template The markdown job summary template  content.
 * @param args The arguments to fill into the template.
 */
export async function jobSummary(
	template: TemplateStringsArray,
	...args: unknown[]
): Promise<void>;

export async function jobSummary(
	content: string | TemplateStringsArray,
	...args: unknown[]
): Promise<void> {
	const key = "GITHUB_STEP_SUMMARRY";
	if (!process.env[key]) {
		throw new Error(`Missing environment variable '${key}'`);
	}
	await writeFile(
		process.env[key],
		typeof content === "string" ? content : String.raw(content, ...args),
	);
}
