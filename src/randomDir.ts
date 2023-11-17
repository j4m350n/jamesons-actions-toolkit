import randomPath from "./randomPath";
import { mkdirSync } from "fs";

/**
 * Create a temporary directory with a random path.
 * @returns The path to the directory.
 */
export function randomDir() {
	const path = randomPath();
	mkdirSync(path, { recursive: true });
	return path;
}

export default randomDir;
