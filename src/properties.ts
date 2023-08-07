import { appendFile, readFile, writeFile } from "node:fs/promises";
import indexOf from "./util/indexOf";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const EOK = /(=|<<)/g;

export function parseProperties(data: string): Record<string, string> {
	const properties: Record<string, string> = {};
	let variableToDelimiterIndex = indexOf(data, EOK);
	while (variableToDelimiterIndex !== -1) {
		const name = data.substring(0, variableToDelimiterIndex);
		const singleline = data[variableToDelimiterIndex] === "=";
		const delimeterLength = singleline ? 1 : 2;
		const eolIndex = data.indexOf(
			"\n",
			variableToDelimiterIndex + delimeterLength,
		);
		if (singleline) {
			properties[name] = data.substring(
				variableToDelimiterIndex + delimeterLength,
				eolIndex,
			);
			data = data.substring(eolIndex + 1);
			variableToDelimiterIndex = indexOf(data, EOK);
			continue;
		}
		const delimiter =
			"\n" +
			data.substring(variableToDelimiterIndex + delimeterLength, eolIndex + 1);
		const closingDelimiterIndex = data.indexOf(delimiter, eolIndex + 1);
		if (closingDelimiterIndex === -1) {
			throw new Error(
				`Error parsing outputs when reading '${name}': unexpected EOF`,
			);
		}
		const outputValue = data.substring(eolIndex + 1, closingDelimiterIndex);
		properties[name] = outputValue;
		data = data.substring(closingDelimiterIndex + delimiter.length);
		variableToDelimiterIndex = data.indexOf("<<");
	}

	return properties;
}

export async function parsePropertiesOfFile(
	path: string,
): Promise<Record<string, string>> {
	return parseProperties((await readFile(path)).toString());
}

function stringifyKeyValue(key: string, value: string) {
	if (value.indexOf("\n") === -1) return `${key}=${value}\n`;
	const delimiter = randomUUID();
	return `${key}<<${delimiter}\n${value}\n${delimiter}\n`;
}

export function stringifyProperties(
	properties: Record<string, string>,
): string {
	let out = "";
	for (const [key, value] of Object.entries(properties)) {
		out += stringifyKeyValue(key, value);
	}
	return out;
}

export function getPropertiesFromEnvFile(
	key: string,
): Promise<Record<string, string>> {
	if (!process.env[key]) {
		throw new Error(`Missing environment variable '${key}'`);
	}
	return parsePropertiesOfFile(process.env[key] as string);
}

export async function savePropertiesToFile(
	path: string,
	properties: Record<string, string>,
) {
	await writeFile(path, stringifyProperties(properties));
}

export async function savePropertiesToEnvFile(
	key: string,
	properties: Record<string, string>,
) {
	if (!process.env[key]) {
		throw new Error(`Missing environment variable '${key}'`);
	}
	await savePropertiesToFile(process.env[key] as string, properties);
}

export async function appendPropertiesToFile(
	path: string,
	properties: Record<string, string>,
) {
	if (!existsSync(path)) {
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, "");
	}
	const content = stringifyProperties(properties);
	await appendFile(path, content);
}

export async function appendPropertiesToEnvFile(
	key: string,
	properties: Record<string, string>,
) {
	if (!process.env[key]) {
		throw new Error(`Missing environment variable '${key}'`);
	}
	await appendPropertiesToFile(process.env[key] as string, properties);
}

export function getGithubEnvironment(): Promise<Record<string, string>> {
	return getPropertiesFromEnvFile("GITHUB_ENV");
}

export function saveGithubEnvironment(
	properties: Record<string, string>,
): Promise<void> {
	return savePropertiesToEnvFile("GITHUB_ENV", properties);
}

export function appendGithubEnvironment(
	properties: Record<string, string>,
): Promise<void> {
	return appendPropertiesToEnvFile("GITHUB_ENV", properties);
}

export function setEnvironmentVariable(key: string, value: string) {
	process.env[key] = value;
	return appendGithubEnvironment({ [key]: value });
}

export function getGithubOutputs(): Promise<Record<string, string>> {
	return getPropertiesFromEnvFile("GITHUB_OUTPUT");
}

export function saveGithubOutputs(
	properties: Record<string, string>,
): Promise<void> {
	return savePropertiesToEnvFile("GITHUB_OUTPUT", properties);
}

export function appendGithubOutputs(
	properties: Record<string, string>,
): Promise<void> {
	return appendPropertiesToEnvFile("GITHUB_OUTPUT", properties);
}

export function setOutput(key: string, value: string) {
	return appendGithubOutputs({ [key]: value });
}
