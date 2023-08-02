import { error } from "console";

export default function setFailed(...args: unknown[]) {
	process.exitCode = 1;
	error(...args);
}
