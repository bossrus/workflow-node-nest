import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { ValidationPipe } from '@nestjs/common';

const httpsOptions = {
	key: fs.readFileSync('.localcert/server.key'),
	cert: fs.readFileSync('.localcert/server.crt'),
};

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		httpsOptions,
	});
	app.useGlobalPipes(new ValidationPipe()); // глобальная проверка каждого входящего запроса
	app.enableCors();
	console.log('enable cors');
	await app.listen(3000);
	console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
