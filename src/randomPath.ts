import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function randomPath() {
	return join(tmpdir(), randomUUID());
}

export default randomPath;
