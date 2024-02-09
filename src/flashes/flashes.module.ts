import { Module } from '@nestjs/common';
import { FlashesService } from './flashes.service';
import { FlashesController } from './flashes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
	FlashMessagesSchema,
	IFlashMessages,
} from '@/dto-schemas-interfaces/flashMessage.dto.schema';
import { WebsocketModule } from '@/websockets/websocket.module';
import { LogModule } from '@/log/log.module';
import { DbModule } from '@/BD/db.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: IFlashMessages.name,
				schema: FlashMessagesSchema,
			},
		]),
		WebsocketModule,
		DbModule,
		LogModule,
	],
	controllers: [FlashesController],
	providers: [FlashesService],
})
export class FlashesModule {}
