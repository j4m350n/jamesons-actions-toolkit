import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default function randomPath() {
	return join(tmpdir(), randomUUID());
}
