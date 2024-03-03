import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { IUser, UserSchema } from '@/dto-schemas-interfaces/user.dto.schema';
import { DbModule } from '@/BD/db.module';
import { MailModule } from '@/mail/mail.module';
import { WebsocketModule } from '@/websockets/websocket.module';
import { LogModule } from '@/log/log.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: IUser.name,
				schema: UserSchema,
			},
		]),
		WebsocketModule,
		LogModule,
		DbModule,
		MailModule,
	],
	controllers: [UsersController],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
