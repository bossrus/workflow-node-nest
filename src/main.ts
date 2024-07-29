import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe()); // глобальная проверка каждого входящего запроса
	app.enableCors({
		origin: 'https://qazxs.fun', // Разрешить запросы с этого домена
		methods: ['GET,HEAD,PUT,PATCH,POST,DELETE'], // Разрешенные методы
		credentials: true, // Разрешить отправку куки
	});
	console.log('\t\t ******** \t\t CORS enabled for https://qazxs.fun');
	await app.listen(3100);
	console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
