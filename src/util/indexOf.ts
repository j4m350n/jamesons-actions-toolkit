export default function indexOf(
	haystack: string,
	needle: string | RegExp,
	startsAt = 0,
) {
	if (startsAt > 0) haystack = haystack.slice(startsAt);
	return typeof needle === "string"
		? haystack.indexOf(needle, startsAt)
		: (startsAt && startsAt > 0 ? haystack.slice(startsAt) : haystack).search(
				needle,
		  );
}
