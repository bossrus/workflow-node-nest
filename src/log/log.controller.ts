import { Controller, Get, Param } from '@nestjs/common';
import Auth from '@/services/auth';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import { LogService } from '@/log/log.service';
import { ILog } from '@/dto-schemas-interfaces/log.dto.schema';

@Controller('log')
export class LogController {
	constructor(private readonly logService: LogService) {}

	@Get(':id')
	@Auth()
	async getLogById(@Param('id', isValidIdPipe) id: string): Promise<ILog[]> {
		return this.logService.getLogById(id);
	}
}
