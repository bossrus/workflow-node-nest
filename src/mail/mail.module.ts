import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { EMAIL_SETTINGS } from '@/consts/email';
import { DbModule } from '@/BD/db.module';

@Module({
	imports: [
		MailerModule.forRoot({
			transport: EMAIL_SETTINGS,
			defaults: {
				from: '"Boss Soft" <noreply@work-flow.site>',
			},
			template: {
				dir: join(__dirname, '../..', 'src', 'mail', 'templates'), //'./templates', //join(__dirname, 'templates'),
				adapter: new HandlebarsAdapter(),
				options: {
					strict: true,
				},
			},
		}),
		DbModule,
	],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule {}
