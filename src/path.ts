import { appendFileSync } from "fs";
import { EOL } from "os";

const key = "GITHUB_PATH";

export function addPath(...dirs: string[]) {
	if (!process.env[key]) {
		throw new Error(`Missing environment variable '${key}'`);
	}
	const str = dirs.join(EOL) + EOL;
	appendFileSync(process.env[key], str);
	process.env["PATH"] = (
		process.env["PATH"] ? process.env["PATH"].split(":") || [] : []
	)
		.concat(dirs)
		.join(":");
}
