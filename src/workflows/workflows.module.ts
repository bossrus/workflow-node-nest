import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
	IWorkflow,
	WorkflowSchema,
} from '@/dto-schemas-interfaces/workflow.dto.schema';
import { DbModule } from '@/BD/db.module';
import { WebsocketModule } from '@/websockets/websocket.module';
import { MailModule } from '@/mail/mail.module';
import { LogModule } from '@/log/log.module';
import { UsersModule } from '@/users/users.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: IWorkflow.name,
				schema: WorkflowSchema,
			},
		]),
		DbModule,
		WebsocketModule,
		MailModule,
		LogModule,
		UsersModule,
	],
	controllers: [WorkflowsController],
	providers: [WorkflowsService],
})
export class WorkflowsModule {}
