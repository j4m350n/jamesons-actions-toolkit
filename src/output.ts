import { randomUUID } from "crypto";
import { formatWithOptions } from "util";

type CommandArgs = Record<string, string | number | boolean | undefined>;

function output(
	command: string,
	commandArgs: CommandArgs,
	format: string,
	args: unknown[],
) {
	const cmdArgs = Object.entries(commandArgs).filter(
		([, value]) => value !== undefined,
	);
	process.stdout.write(
		`::${command}${cmdArgs.length ? " " : ""}${cmdArgs}::${formatWithOptions(
			{
				colors: true,
				depth: Infinity,
				maxArrayLength: Infinity,
				maxStringLength: Infinity,
			},
			format,
			...args,
		)}`,
	);
}

class Options<T extends CommandArgs> {
	constructor(public readonly options: T) {}
}

function outputWithArgs(
	command: string,
	args: unknown[],
	lastIsOptions: boolean,
) {
	let commandArgs: CommandArgs;
	if (
		lastIsOptions &&
		args.length &&
		args[args.length - 1] instanceof Options
	) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any
		commandArgs = (args.pop()! as Options<any>).options;
	} else {
		commandArgs = {};
	}
	if (args.length && typeof args[0] === "string") {
		output(command, commandArgs, args[0], args.slice(1));
	} else {
		output(command, commandArgs, "%o".repeat(args.length), args);
	}
}

export function annotation(
	args: AnnotationOptions,
): Options<AnnotationOptions> {
	return new Options(args);
}

export function debug(...args: unknown[]) {
	outputWithArgs("debug", args, false);
}

export interface AnnotationOptions extends CommandArgs {
	title?: string;
	file?: string;
	col?: number;
	endColumn?: number;
	line?: number;
}

export type Annotation = (
	...args: [...unknown[], Options<AnnotationOptions>] | [...unknown[]]
) => void;

export const notice: Annotation = (...args) =>
	outputWithArgs("notice", args, true);
export const warning: Annotation = (...args) =>
	outputWithArgs("warning", args, true);
export const warn = warning;
export const error: Annotation = (...args) =>
	outputWithArgs("warning", args, true);
export const group = (title: string) => output("group", {}, "%s", [title]);
export const endGroup = () => output("endgroup", {}, "", []);
export const addMask = (value: string) => output("add-mask", {}, "%s", [value]);
export const stopCommands = (id: string = randomUUID()) => (
	output("stop-commands", {}, "%s", [id]), id
);
export const startCommands = (id: string) => output(id, {}, "", []);
