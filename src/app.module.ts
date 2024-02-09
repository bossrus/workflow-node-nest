import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websockets/websocket.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DB_URI } from '@/consts/db';
import { DepartmentsModule } from './departments/departments.module';
import { UsersModule } from '@/users/users.module';
import { ModificationsModule } from '@/modifications/modifications.module';
import { FirmsModule } from '@/firms/firms.module';
import { LogModule } from '@/log/log.module';
import { WorktypesModule } from '@/worktypes/worktypes.module';
import { InvitesModule } from '@/invites/invites.module';
import { FlashesModule } from '@/flashes/flashes.module';

@Module({
	imports: [
		MongooseModule.forRoot(DB_URI),
		WebsocketModule,
		LogModule,
		UsersModule,
		DepartmentsModule,
		ModificationsModule,
		FirmsModule,
		WorktypesModule,
		InvitesModule,
		FlashesModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
