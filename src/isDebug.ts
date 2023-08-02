export default function isDebug() {
	return process.env["RUNNER_DEBUG"] === "1";
}
