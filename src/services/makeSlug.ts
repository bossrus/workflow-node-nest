/**
 * Converts a given string into a URL-friendly slug.
 * The function transforms the string to lowercase, replaces spaces with hyphens,
 * and removes any non-alphanumeric characters except for hyphens.
 *
 * @param str - The input string to be converted into a slug.
 * @returns The URL-friendly slug.
 */
const makeSlug = (str: string): string => {
	return str
		.toLowerCase()
		.replace(/ /g, '-')
		.replace(/[^\wа-яёЁА-Я-]+/g, '');
};

export default makeSlug;
