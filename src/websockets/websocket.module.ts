import { Module } from '@nestjs/common';
import { WebsocketService } from './websocket.service';
import { DbModule } from '@/BD/db.module';

@Module({
	imports: [DbModule],
	providers: [WebsocketService],
	exports: [WebsocketService],
})
export class WebsocketModule {}
