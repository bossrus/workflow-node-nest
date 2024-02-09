const makeSlug = (str: string) => {
	return str
		.toLowerCase()
		.replace(/ /g, '-')
		.replace(/[^\wа-яёЁА-Я-]+/g, '');
};

export default makeSlug;
