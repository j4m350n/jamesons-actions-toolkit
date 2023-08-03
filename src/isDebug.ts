export function isDebug() {
	return process.env["RUNNER_DEBUG"] === "1";
}

export default isDebug;
