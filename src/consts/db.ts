export const BD_URI = 'mongodb://localhost:27017/workflows';

export const FIELDS_TO_DELETE = ['__v', 'password', 'loginSlug', 'titleSlug'];
export const DB_IGNORE_FIELDS = '-' + FIELDS_TO_DELETE.join(' -');
