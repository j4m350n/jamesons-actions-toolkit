import { resolve } from "node:path";
import { accessSync, constants } from "node:fs";
import { arch as archType, type } from "node:os";
import {
	type SpawnOptionsWithoutStdio,
	type ChildProcess,
	spawn,
} from "node:child_process";
import Callable from "./util/Callable";
import { WritableStream, ReadableStream } from "node:stream/web";
import { rawString } from "./util";

export interface Commandline {
	name: string;
	path: string | undefined;
	supports(os: string, arch: string): boolean;
	available(): boolean;
	buildExecCommand(script: string): string[];
}

const isUnix = type() !== "Windows_NT";
const os = type();
const arch = archType();

function whichSync(command: string) {
	const cwd = process.cwd();
	return (process.env.PATH || "")
		.split(/:+/g)
		.map((path) => resolve(cwd, path, command))
		.find((path) => {
			try {
				accessSync(path, constants.X_OK);
				return true;
			} catch {
				return false;
			}
		});
}

export const Shell: Commandline = {
	name: "sh",
	path: whichSync("sh") || whichSync("sh.exe"),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	supports(_os: string, _arch: string): boolean {
		return true;
	},
	available(): boolean {
		return this.path !== undefined;
	},
	buildExecCommand(script: string): string[] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return [this.path!, "-c", script];
	},
};

export const Bash: Commandline = {
	name: "bash",
	path: whichSync("bash") || whichSync("bash.exe"),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	supports(_os: string, _arch: string): boolean {
		return true;
	},
	available(): boolean {
		return this.path !== undefined;
	},
	buildExecCommand(script: string): string[] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return [this.path!, "-c", script];
	},
};

export const PowerShell: Commandline = {
	name: "powershell",
	path:
		whichSync("pwsh") ||
		whichSync("pwsh.exe") ||
		whichSync("powershell") ||
		whichSync("powershell.exe"),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	supports(_os: string, _arch: string): boolean {
		return true;
	},
	available(): boolean {
		return this.path !== undefined;
	},
	buildExecCommand(script: string): string[] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return [this.path!, "-Command", script];
	},
};

export const Batch: Commandline = {
	name: "batch",
	path: whichSync("cmd.exe"),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	supports(_os, _arch) {
		return !isUnix;
	},
	available() {
		return this.path !== undefined;
	},
	buildExecCommand(script: string): string[] {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return [this.path!, "/s", script];
	},
};

export class FinishedProcess {
	public constructor(
		public readonly shell: Cash,
		public readonly stdall: string,
		public readonly stderr: string,
		public readonly stdout: string,
		public readonly code: number,
	) {}
}

export class AwaitableReadableStringStream
	extends ReadableStream<string>
	implements PromiseLike<string>
{
	$shell: Cash;
	$proc: ChildProcess;
	$streams: ChildProcess["stdout"][];

	public constructor(
		shell: Cash,
		proc: ChildProcess,
		streams: ChildProcess["stdout"][],
		underlyingSource: UnderlyingByteSource,
		strategy?: { highWaterMark?: number },
	);
	public constructor(
		shell: Cash,
		proc: ChildProcess,
		streams: ChildProcess["stdout"][],
		underlyingSource: UnderlyingDefaultSource<string>,
		strategy?: QueuingStrategy<string>,
	);
	public constructor(
		shell: Cash,
		proc: ChildProcess,
		streams: ChildProcess["stdout"][],
		underlyingSource?: UnderlyingSource<string>,
		strategy?: QueuingStrategy<string>,
	);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public constructor(
		shell: Cash,
		proc: ChildProcess,
		streams: ChildProcess["stdout"][],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		...superArgs: any[]
	) {
		super(...superArgs);
		this.$shell = shell;
		this.$proc = proc;
		this.$streams = streams;
	}

	async then<TResult1 = string, TResult2 = never>(
		onfulfilled?:
			| ((value: string) => TResult1 | PromiseLike<TResult1>)
			| undefined
			| null,
		onrejected?: // eslint-disable-next-line @typescript-eslint/no-explicit-any
		((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
	) {
		return new Promise<string>((resolve, reject) => {
			let out = "";

			const dataListener = (chunk: Buffer) => (out += chunk.toString("utf8"));

			const cleanup = () => {
				for (const stream of this.$streams as NonNullable<
					ChildProcess["stdout"]
				>[]) {
					stream.off("data", dataListener);
				}
			};

			for (const stream of this.$streams as NonNullable<
				ChildProcess["stdout"]
			>[]) {
				stream.on("data", dataListener);
			}

			this.$proc.on("exit", (code) => {
				cleanup();
				if (code === null) {
					code = 0;
				}
				if (code > 0 && !this.$shell.ignoreExitCode) {
					return reject(new Error("Shell exited with non-zero code!"));
				}
				resolve(out);
			});
		}).then(onfulfilled, onrejected);
	}
}

function createReadableStreamOfNodeStream(
	shell: Cash,
	proc: ChildProcess,
	...streams: ChildProcess["stdout"][]
): AwaitableReadableStringStream | undefined {
	let closes = 0;

	return streams.every((stream) => !!stream)
		? new AwaitableReadableStringStream(shell, proc, streams, {
				start(controller) {
					const closeListener = () => {
						closes++;
						if (closes === streams.length) {
							cleanup();
							controller.close();
						}
					};
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const errorListener = (error: any) => (
						cleanup(), controller.error(error)
					);
					const dataListener = (chunk: Buffer) =>
						controller.enqueue(chunk.toString("utf8"));

					const cleanup = () => {
						for (const stream of streams as NonNullable<
							ChildProcess["stdout"]
						>[]) {
							stream.off("close", closeListener);
							stream.off("end", closeListener);
							stream.off("error", errorListener);
							stream.off("data", dataListener);
						}
					};

					for (const stream of streams as NonNullable<
						ChildProcess["stdout"]
					>[]) {
						stream.on("close", closeListener);
						stream.on("end", closeListener);
						stream.on("error", errorListener);
						stream.on("data", dataListener);
					}
				},
		  })
		: undefined;
}

function createInputStream(stdin: ChildProcess["stdin"]) {
	return stdin
		? new WritableStream({
				write(input) {
					return new Promise((resolve, reject) => {
						stdin.write(Buffer.from(input, "utf8"), (err) => {
							if (err) return reject(err);
							return resolve();
						});
					});
				},
		  })
		: undefined;
}

export class RunningProcess implements PromiseLike<FinishedProcess> {
	$shell: Cash;
	$proc: ChildProcess;

	$stdout = "";
	$stderr = "";
	$stdall = "";

	public constructor(shell: Cash, proc: ChildProcess) {
		this.$shell = shell;
		this.$proc = proc;
		this.stdout = createReadableStreamOfNodeStream(
			this.$shell,
			this.$proc,
			this.$proc.stdout,
		);
		this.stderr = createReadableStreamOfNodeStream(
			this.$shell,
			this.$proc,
			this.$proc.stderr,
		);
		this.stdall = createReadableStreamOfNodeStream(
			this.$shell,
			this.$proc,
			this.$proc.stdout,
			this.$proc.stderr,
		);
		this.stdin = createInputStream(this.$proc.stdin);

		const stdall = (data: string): string => ((this.$stdall += data), data);

		proc.stdout?.on(
			"data",
			(chunk: Buffer) => (this.$stdout += stdall(chunk.toString("utf8"))),
		);
		proc.stderr?.on(
			"data",
			(chunk: Buffer) => (this.$stderr += stdall(chunk.toString("utf8"))),
		);
	}

	public readonly stdout: AwaitableReadableStringStream | undefined;
	public readonly stderr: AwaitableReadableStringStream | undefined;
	public readonly stdall: AwaitableReadableStringStream | undefined;
	public readonly stdin: WritableStream<string> | undefined;

	public async write(input: string) {
		if (!this.stdin) {
			throw new Error("Process does not have input stream!");
		}
		const writer = this.stdin.getWriter();
		try {
			await writer.ready;
			await writer.write(input);
			writer.releaseLock();
		} catch (error) {
			writer.releaseLock();
		}
	}

	public then<TResult1 = FinishedProcess, TResult2 = never>(
		onfulfilled?:
			| ((value: FinishedProcess) => TResult1 | PromiseLike<TResult1>)
			| null
			| undefined,
		onrejected?: // eslint-disable-next-line @typescript-eslint/no-explicit-any
		((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined,
	) {
		return new Promise<FinishedProcess>((resolve, reject) => {
			this.$proc.on("exit", (code) => {
				if (code === null) code = 0;
				if (code > 0 && !this.$shell.ignoreExitCode) {
					return reject(new Error("Shell exited with non-zero code!"));
				}
				resolve(
					new FinishedProcess(
						this.$shell,
						this.$stdall,
						this.$stderr,
						this.$stdout,
						code,
					),
				);
			});
		}).then(onfulfilled, onrejected);
	}
}

export class Cash extends Callable<
	(template: TemplateStringsArray, ...args: unknown[]) => RunningProcess
> {
	$commandline!: Commandline;

	public readonly spawnOptions: SpawnOptionsWithoutStdio = {};

	public ignoreExitCode = false;

	public constructor(commandline: Commandline) {
		super((template: TemplateStringsArray, ...args: unknown[]) =>
			this.exec(rawString(template, ...args)),
		);
		this.setShell(commandline);
	}

	public setShell(shell: Commandline) {
		if (!shell.supports(os, arch)) {
			throw new Error(
				`Shell '${shell.name}' is not supported for ${os} (${arch})`,
			);
		}
		if (!shell.available()) {
			throw new Error(`Shell '${shell.name}' is not available.`);
		}
		this.$commandline = shell;
	}

	public exec(script: string): RunningProcess {
		const cmd = this.$commandline.buildExecCommand(script);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const proc = spawn(cmd.shift()!, cmd, this.spawnOptions);
		return new RunningProcess(this, proc);
	}
}

export default Cash;
