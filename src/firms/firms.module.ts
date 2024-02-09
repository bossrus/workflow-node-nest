import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FirmSchema, IFirm } from '@/dto-schemas-interfaces/firm.dto.schema';
import { FirmsController } from '@/firms/firms.controller';
import { FirmsService } from '@/firms/firms.service';
import { DbModule } from '@/BD/db.module';
import { WebsocketModule } from '@/websockets/websocket.module';
import { LogModule } from '@/log/log.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: IFirm.name,
				schema: FirmSchema,
			},
		]),
		DbModule,
		WebsocketModule,
		LogModule,
	],
	controllers: [FirmsController],
	providers: [FirmsService],
})
export class FirmsModule {}
