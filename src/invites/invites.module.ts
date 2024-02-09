import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
	IInviteToJoin,
	InviteToJoinSchema,
} from '@/dto-schemas-interfaces/inviteToJoin.dto.schema';
import { InvitesController } from '@/invites/invites.controller';
import { InvitesService } from '@/invites/invites.service';
import { WebsocketModule } from '@/websockets/websocket.module';
import { DbModule } from '@/BD/db.module';
import { LogModule } from '@/log/log.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: IInviteToJoin.name,
				schema: InviteToJoinSchema,
			},
		]),
		WebsocketModule,
		DbModule,
		LogModule,
	],
	controllers: [InvitesController],
	providers: [InvitesService],
})
export class InvitesModule {}
