import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
} from '@nestjs/common';
import { ModificationsService } from './modifications.service';
import {
	IModification,
	IModificationUpdate,
} from '@/dto-schemas-interfaces/modification.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { IModificationsDB } from '@/BD/modificationsDB.service';

@Controller('modifications')
export class ModificationsController {
	constructor(private readonly modificationsService: ModificationsService) {}

	@Get()
	@Auth()
	async findAllModifications(): Promise<IModificationsDB> {
		return this.modificationsService.findAllModifications();
	}

	@Get(':id')
	@Auth()
	async findModificationById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IModification> {
		return this.modificationsService.findModificationById(id);
	}

	@Patch()
	@Auth('admin')
	async updateModification(
		@Body() updateModificationDto: IModificationUpdate,
		@Headers('auth_login') login: string,
	): Promise<IModification> {
		return this.modificationsService.updateModification(
			updateModificationDto,
			login,
		);
	}

	@Delete(':id')
	@Auth('admin')
	async deleteModification(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.modificationsService.deleteModification(id, login);
	}
}
