export const BD_URI =
	'mongodb://bossAdmin:uACoKOLQzAhLE@127.0.0.1:27017?authSource=admin';

export const FIELDS_TO_DELETE = ['__v', 'password', 'loginSlug', 'titleSlug'];
export const DB_IGNORE_FIELDS = '-' + FIELDS_TO_DELETE.join(' -');
