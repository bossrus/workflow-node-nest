import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
	IModification,
	ModificationSchema,
} from '@/dto-schemas-interfaces/modification.dto.schema';
import { ModificationsController } from '@/modifications/modifications.controller';
import { ModificationsService } from '@/modifications/modifications.service';
import { DbModule } from '@/BD/db.module';
import { WebsocketModule } from '@/websockets/websocket.module';
import { LogModule } from '@/log/log.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: IModification.name,
				schema: ModificationSchema,
			},
		]),
		DbModule,
		WebsocketModule,
		LogModule,
	],
	controllers: [ModificationsController],
	providers: [ModificationsService],
})
export class ModificationsModule {}
