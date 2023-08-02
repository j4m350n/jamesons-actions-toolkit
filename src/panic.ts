import { error } from "./output";

export function panic(...args: unknown[]) {
	error(...args);
	process.exit(1);
}
