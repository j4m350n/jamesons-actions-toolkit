import { parseProperties } from "./properties";

it("parses multiple single- and multiline properties", () => {
	expect(
		parseProperties(`foo=bar\nbaz<<delimiter\ndaz\ndelimiter\n`),
	).toMatchObject({ foo: "bar", baz: "daz" });
});
