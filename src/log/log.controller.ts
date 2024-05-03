import { Body, Controller, Post } from '@nestjs/common';
import Auth from '@/services/auth';
import { LogService } from '@/log/log.service';
import { ILogObject } from '@/dto-schemas-interfaces/log.dto.schema';
import { IMongoIdArray } from '@/dto-schemas-interfaces/mongoIds.dto.schema';

@Controller('log')
export class LogController {
	constructor(private readonly logService: LogService) {}

	@Post('')
	@Auth()
	async getLogById(@Body() workflowIds: IMongoIdArray): Promise<ILogObject> {
		return this.logService.getLogById(workflowIds);
	}
}
