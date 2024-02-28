import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
} from '@nestjs/common';
import { WorktypesService } from './worktypes.service';
import {
	IWorktype,
	IWorktypeUpdate,
} from '@/dto-schemas-interfaces/worktype.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { IWorktypesDB } from '@/BD/worktypesDB.service';

@Controller('typesOfWork')
export class WorktypesController {
	constructor(private readonly worktypesService: WorktypesService) {}

	@Get()
	@Auth()
	async findAllWorktypes(): Promise<IWorktypesDB> {
		return this.worktypesService.findAllWorktypes();
	}

	@Get(':id')
	@Auth()
	async findWorktypeById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IWorktype> {
		return this.worktypesService.findWorktypeById(id);
	}

	@Patch()
	@Auth('admin')
	async updateWorktype(
		@Body() updateWorktypeDto: IWorktypeUpdate,
		@Headers('auth_login') login: string,
	): Promise<IWorktype> {
		return this.worktypesService.updateWorktype(updateWorktypeDto, login);
	}

	@Delete(':id')
	@Auth('admin')
	async deleteWorktype(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.worktypesService.deleteWorktype(id, login);
	}
}
