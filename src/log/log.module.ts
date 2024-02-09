import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ILog, LogSchema } from '@/dto-schemas-interfaces/log.dto.schema';
import { LogController } from './log.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: ILog.name,
				schema: LogSchema,
			},
		]),
	],
	providers: [LogService],
	exports: [LogService],
	controllers: [LogController],
})
export class LogModule {}
