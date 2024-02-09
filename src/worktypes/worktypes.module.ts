import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
	WorktypeSchema,
	IWorktype,
} from '@/dto-schemas-interfaces/worktype.dto.schema';
import { WorktypesController } from '@/worktypes/worktypes.controller';
import { WorktypesService } from '@/worktypes/worktypes.service';
import { DbModule } from '@/BD/db.module';
import { LogModule } from '@/log/log.module';
import { WebsocketModule } from '@/websockets/websocket.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: IWorktype.name,
				schema: WorktypeSchema,
			},
		]),
		DbModule,
		LogModule,
		WebsocketModule,
	],
	controllers: [WorktypesController],
	providers: [WorktypesService],
})
export class WorktypesModule {}
