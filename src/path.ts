import { appendFile } from "fs/promises";
import { EOL } from "os";

const key = "GITHUB_PATH";

export async function addPath(...dirs: string[]) {
	if (!process.env[key]) {
		throw new Error(`Missing environment variable '${key}'`);
	}
	const str = dirs.join(EOL) + EOL;
	process.env[key] += str;
	await appendFile(process.env[key], str);
}
