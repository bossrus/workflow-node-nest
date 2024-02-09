import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { ValidationPipe } from '@nestjs/common';

const httpsOptions = {
	key: fs.readFileSync('.localcert/server.key'),
	cert: fs.readFileSync('.localcert/server.crt'),
};

// подключить mongodb • DONE
// создать юзверя • DONE
// создать modification • DONE
// создать department  • DONE
// оповещение о новых сущностях по ws  • DONE
// о все сущности добавить isDeleted  • DONE
// переделать все сервисы на delete  • DONE
// на получение объекта сделать isDeleted = false  • DONE
// раздать отображаемые поля (потому что людям нафик не нужны всякие слаги, __v и прочее) версии нужны.  • DONE
// у юзеров сделать отдельный возврат краткой информации (имя, ид, список отделов)  • DONE
// login  • DONE
// своего пользователя в полном объёме (кроме слага и __v, наверно) отдавать на результат авторизации  • DONE
// авторизация ^)  • DONE
// на возврат списка юзверей с полными данными повесить требование админа,  • DONE
// на обновления и создания отдельные требования по доступу  • DONE
// добавление мыла - не админ и своему пользователю  • DONE
// отправка письма  • DONE
// подтверждение мыла  • DONE
//  создать log  • DONE
//  добавить log на все действия, кроме запросов  • DONE
//  создать firms  • DONE
//  создать typesOfWorkflow  • DONE
//  создать inviteToJoi  • DONE
// создать flashMessages  • DONE
//  создать Workflow  • DONE
//  при редактировании Workflow отправлять почту  • DONE
//  отдельные ендпоинты в workflow:   • DONE
//  опубликовано (массово) + почта • DONE
//  добавление текста в чат • DONE
//  добавление работников, кто работает над проектом (взять в работу) • DONE
//  закончить работу (тут в description лога уточнить куда пошла работа) +почта, если сменился отдел • DONE
//  отметить в статистике (массово)  • DONE
//  при адресных сообщениях по ws сделать отсылку только адресатам   • DONE
//  сделать показатель того, кто онлайн (через ws)  • DONE
// TODO Workflow запросы для статистика (разный набор полей, игнорирование isDone)
// TODO сделать чат (?)

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		httpsOptions,
	});
	app.useGlobalPipes(new ValidationPipe()); // глобальная проверка каждого входящего запроса
	await app.listen(3000);
	console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
