import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
} from '@nestjs/common';
import { TypesOfWorkService } from './typesOfWork.service';
import {
	ITypeOfWork,
	ITypeOfWorkUpdate,
} from '@/dto-schemas-interfaces/typeOfWork.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { ITypesOfWorkDB } from '@/BD/typesOfWorkDB.service';

@Controller('typesOfWork')
export class TypesOfWorkController {
	constructor(private readonly typesOfWorkService: TypesOfWorkService) {}

	@Get()
	@Auth()
	async findAllTypesOfWork(): Promise<ITypesOfWorkDB> {
		return this.typesOfWorkService.findAllTypesOfWork();
	}

	@Get(':id')
	@Auth()
	async findTypeOfWorkById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<ITypeOfWork> {
		return this.typesOfWorkService.findTypeOfWorkById(id);
	}

	@Patch()
	@Auth('admin')
	async updateTypeOfWork(
		@Body() updateTypeOfWorkDto: ITypeOfWorkUpdate,
		@Headers('auth_login') login: string,
	): Promise<ITypeOfWork> {
		return this.typesOfWorkService.updateTypeOfWork(
			updateTypeOfWorkDto,
			login,
		);
	}

	@Delete(':id')
	@Auth('admin')
	async deleteTypeOfWork(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.typesOfWorkService.deleteTypeOfWork(id, login);
	}
}
