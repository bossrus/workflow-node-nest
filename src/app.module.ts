import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websockets/websocket.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BD_URI } from '@/consts/db';
import { DepartmentsModule } from './departments/departments.module';
import { UsersModule } from '@/users/users.module';
import { ModificationsModule } from '@/modifications/modifications.module';
import { FirmsModule } from '@/firms/firms.module';
import { LogModule } from '@/log/log.module';
import { TypesOfWorkModule } from '@/typesOfWork/typesOfWork.module';
import { InvitesModule } from '@/invites/invites.module';
import { FlashesModule } from '@/flashes/flashes.module';
import { WorkflowsModule } from '@/workflows/workflows.module';

@Module({
	imports: [
		MongooseModule.forRoot(BD_URI, {
			dbName: 'workflows',
		}),
		WebsocketModule,
		LogModule,
		UsersModule,
		DepartmentsModule,
		ModificationsModule,
		FirmsModule,
		TypesOfWorkModule,
		InvitesModule,
		FlashesModule,
		WorkflowsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
