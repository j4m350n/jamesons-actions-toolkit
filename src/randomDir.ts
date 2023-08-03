import { mkdir } from "fs/promises";
import randomPath from "./randomPath";

/**
 * Create a temporary directory with a random path.
 * @returns The path to the directory.
 */
export async function randomDir() {
	const path = randomPath();
	await mkdir(path, { recursive: true });
	return path;
}

export default randomDir;
