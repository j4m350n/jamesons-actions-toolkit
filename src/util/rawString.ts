export function rawString(
	template: TemplateStringsArray,
	...args: unknown[]
): string {
	let str = template[0] || "";
	for (let index = 0; index < args.length; index++) {
		str += args[index] + template[index + 1];
	}
	return str;
}

export default rawString;
