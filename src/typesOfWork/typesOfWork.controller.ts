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

	/**
	 * Get all types of work.
	 * @returns {Promise<ITypesOfWorkDB>} A promise that resolves to the list of all types of work.
	 */
	@Get()
	@Auth()
	async findAllTypesOfWork(): Promise<ITypesOfWorkDB> {
		return this.typesOfWorkService.findAllTypesOfWork();
	}

	/**
	 * Update Types Of Work BD on server.
	 * @returns 'ok'
	 */
	@Get('update')
	@Auth('admin')
	async updateAllTypesOfWork(): Promise<string> {
		await this.typesOfWorkService.onModuleInit();
		return 'ok';
	}

	/**
	 * Get a type of work by its ID.
	 * @param {string} id - The ID of the type of work.
	 * @returns {Promise<ITypeOfWork>} A promise that resolves to the type of work.
	 */
	@Get(':id')
	@Auth()
	async findTypeOfWorkById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<ITypeOfWork> {
		return this.typesOfWorkService.findTypeOfWorkById(id);
	}

	/**
	 * Update or create a type of work.
	 * @param {ITypeOfWorkUpdate} updateTypeOfWorkDto - The data transfer object containing the updated type of work information.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<ITypeOfWork>} A promise that resolves to the updated type of work.
	 */
	@Patch()
	@Auth('admin')
	async updateTypeOfWork(
		@Body() updateTypeOfWorkDto: ITypeOfWorkUpdate,
		@Headers('authlogin') login: string,
	): Promise<ITypeOfWork> {
		return this.typesOfWorkService.updateTypeOfWork(
			updateTypeOfWorkDto,
			login,
		);
	}

	/**
	 * Delete a type of work by its ID.
	 * @param {string} id - The ID of the type of work.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<void>} A promise that resolves when the type of work is deleted.
	 */
	@Delete(':id')
	@Auth('admin')
	async deleteTypeOfWork(
		@Param('id', isValidIdPipe) id: string,
		@Headers('authlogin') login: string,
	): Promise<void> {
		return this.typesOfWorkService.deleteTypeOfWork(id, login);
	}
}
