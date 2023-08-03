import { error } from "console";

export function setFailed(...args: unknown[]) {
	process.exitCode = 1;
	error(...args);
}

export default setFailed;
