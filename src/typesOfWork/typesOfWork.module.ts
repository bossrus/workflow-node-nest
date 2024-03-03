import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
	TypeOfWorkSchema,
	ITypeOfWork,
} from '@/dto-schemas-interfaces/typeOfWork.dto.schema';
import { TypesOfWorkController } from '@/typesOfWork/typesOfWork.controller';
import { TypesOfWorkService } from '@/typesOfWork/typesOfWork.service';
import { DbModule } from '@/BD/db.module';
import { LogModule } from '@/log/log.module';
import { WebsocketModule } from '@/websockets/websocket.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: ITypeOfWork.name,
				schema: TypeOfWorkSchema,
			},
		]),
		DbModule,
		LogModule,
		WebsocketModule,
	],
	controllers: [TypesOfWorkController],
	providers: [TypesOfWorkService],
})
export class TypesOfWorkModule {}
