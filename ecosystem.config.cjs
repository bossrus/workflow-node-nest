module.exports = {
	apps: [{
		name: 'nest',
		script: './dist/main.js',
		instances: 'max',
		autorestart: true,
		watch: false,
		max_memory_restart: '500M',
		env: {
			NODE_ENV: 'production',
		},
		output: 'out.log',
		error: 'error.log',
		log_date_format: 'DD-MM-YYYY HH:mm:ss',
		time: true,
	}],
};
