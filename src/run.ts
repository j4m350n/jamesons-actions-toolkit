import isDebug from "./isDebug";
import setFailed from "./setFailed";

let hasRun = false;

export function run(action: () => unknown) {
	if (hasRun) {
		throw new Error("This function is only meant to be run once");
	}
	hasRun = true;
	const result = action();
	if (result instanceof Promise) {
		result.catch((error) => {
			if (error instanceof Error) {
				if (isDebug()) {
					if (error.stack?.startsWith("Error: ")) {
						setFailed(error.stack?.substring(7) || error.message);
					} else {
						setFailed(error.stack || error.message);
					}
				} else {
					if (error.stack?.startsWith("Error: ")) {
						setFailed(error.message);
					} else {
						setFailed(error.name + ": " + error.message);
					}
				}
			} else {
				setFailed(error);
			}
		});
	}
}

export default run;
