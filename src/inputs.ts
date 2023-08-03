export function getInput(name: string): string;
export function getInput(
	name: string,
	options: { optional: true },
): string | undefined;
export function getInput(name: string, options: { optional: false }): string;
export function getInput<Optional extends boolean>(
	name: string,
	options: { optional?: Optional },
): Optional extends true ? string | undefined : string;
export function getInput<Output>(
	name: string,
	options: { type: (value: string) => Output },
): Output;
export function getInput<Output>(
	name: string,
	options: {
		optional: true;
		type: (value: string) => Output;
	},
): Output | undefined;
export function getInput<Output>(
	name: string,
	options: {
		optional: false;
		type: (value: string) => Output;
	},
): Output;
export function getInput<Optional extends boolean, Output>(
	name: string,
	options: {
		optional?: Optional | undefined;
		type: (value: string) => Output;
	},
): Optional extends true ? undefined | Output : Output;

export function getInput(
	name: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options?: { optional?: boolean; type?: (value: string) => any },
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
	options ??= {};
	options.type ??= string;
	options.optional ??= false;
	const value = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`];
	if (value === undefined && options.optional !== true) {
		throw new Error(`Missing required input '${name}'`);
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if (value === undefined) return undefined as any;
	try {
		return options.type(value);
	} catch (error) {
		throw new Error(`Unable to parse input '${name}'`);
	}
}

export default getInput;

// types
export function string(value: string): string {
	return value;
}

export function number(value: string): number {
	const n = Number(value);
	if (Number.isNaN(n)) {
		throw new Error("Could not parse number");
	}
	return n;
}

export function integer(value: string): number {
	const n = parseInt(value);
	if (Number.isNaN(n)) {
		throw new Error("Could not parse integer");
	}
	return n;
}

export const BOOLEAN_VALUES: Record<string, boolean> = {
	// truthy
	true: true,
	y: true,
	yes: true,
	on: true,
	enable: true,
	enabled: true,
	active: true,
	activated: true,

	// falsy
	false: false,
	n: false,
	no: false,
	off: false,
	disable: false,
	disabled: false,
	inactive: false,
};

export function boolean(value: string): boolean;
export function boolean(
	value: string | { strict?: boolean },
): boolean | ((value: string) => boolean) {
	if (typeof value === "string") {
		return BOOLEAN_VALUES[value] === true;
	}
	const options = value;
	return (value) => {
		if (options.strict && !(value in BOOLEAN_VALUES)) {
			throw new Error(
				`Invalid boolean value '${value}', possible values are ${Object.keys(
					BOOLEAN_VALUES,
				)
					.map((bool) => `'${bool}'`)
					.join(", ")}`,
			);
		}
		return BOOLEAN_VALUES[value] === true;
	};
}

export function listOf<T>(
	type: (value: string) => T,
	{ separator = /[,\s]+/g }: { separator?: string | RegExp } = {},
): (value: string) => T[] {
	return (value) => value.split(separator).map(type);
}
