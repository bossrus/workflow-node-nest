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

	/**
	 * Retrieve all modifications.
	 * @returns {Promise<IModificationsDB>} A promise that resolves to the list of all modifications.
	 */
	@Get()
	@Auth()
	async findAllModifications(): Promise<IModificationsDB> {
		return this.modificationsService.findAllModifications();
	}

	/**
	 * Update all modifications.
	 * This endpoint is restricted to admin users.
	 * @returns {Promise<string>} A promise that resolves to a confirmation message.
	 */
	@Get('update')
	@Auth('admin')
	async updateAllModifications(): Promise<string> {
		await this.modificationsService.onModuleInit();
		return 'ok';
	}

	/**
	 * Retrieve a modification by its ID.
	 * @param {string} id - The ID of the modification.
	 * @returns {Promise<IModification>} A promise that resolves to the modification with the specified ID.
	 */
	@Get(':id')
	@Auth()
	async findModificationById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IModification> {
		return this.modificationsService.findModificationById(id);
	}

	/**
	 * Update or create a modification.
	 * This endpoint is restricted to admin users.
	 * @param {IModificationUpdate} updateModificationDto - The modification update data.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<IModification>} A promise that resolves to the updated modification.
	 */
	@Patch()
	@Auth('admin')
	async updateModification(
		@Body() updateModificationDto: IModificationUpdate,
		@Headers('authlogin') login: string,
	): Promise<IModification> {
		return this.modificationsService.updateModification(
			updateModificationDto,
			login,
		);
	}

	/**
	 * Delete a modification by its ID.
	 * This endpoint is restricted to admin users.
	 * @param {string} id - The ID of the modification to delete.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<void>} A promise that resolves when the modification is deleted.
	 */
	@Delete(':id')
	@Auth('admin')
	async deleteModification(
		@Param('id', isValidIdPipe) id: string,
		@Headers('authlogin') login: string,
	): Promise<void> {
		return this.modificationsService.deleteModification(id, login);
	}
}
