import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
} from '@nestjs/common';
import { FirmsService } from './firms.service';
import { IFirm, IFirmUpdate } from '@/dto-schemas-interfaces/firm.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { IFirmsDB } from '@/BD/firmsDB.service';

@Controller('firms')
export class FirmsController {
	constructor(private readonly firmsService: FirmsService) {}

	/**
	 * Retrieves all firms.
	 * @returns A list of all firms.
	 */
	@Get()
	@Auth()
	async findAllFirms(): Promise<IFirmsDB> {
		return this.firmsService.findAllFirms();
	}

	/**
	 * Retrieves a firm by its ID.
	 * @param id - The ID of the firm.
	 * @returns The firm with the specified ID.
	 */
	@Get(':id')
	@Auth()
	async findFirmById(@Param('id', isValidIdPipe) id: string): Promise<IFirm> {
		return this.firmsService.findFirmById(id);
	}

	/**
	 * Update firms BD object
	 */
	@Get('update')
	@Auth('admin')
	async updateAllDepartments(): Promise<string> {
		await this.firmsService.onModuleInit();
		return 'ok';
	}

	/**
	 * Updates or create an existing firm.
	 * @param updateFirmDto - Data transfer object containing updated firm details.
	 * @param login - The login of the user updating the firm.
	 * @returns The updated firm.
	 */
	@Patch()
	@Auth('admin')
	async updateFirm(
		@Body() updateFirmDto: IFirmUpdate,
		@Headers('authlogin') login: string,
	): Promise<IFirm> {
		return this.firmsService.updateFirm(updateFirmDto, login);
	}

	/**
	 * Deletes a firm by its ID.
	 * @param id - The ID of the firm to delete.
	 * @param login - The login of the user deleting the firm.
	 */
	@Delete(':id')
	@Auth('admin')
	async deleteFirm(
		@Param('id', isValidIdPipe) id: string,
		@Headers('authlogin') login: string,
	): Promise<void> {
		return this.firmsService.deleteFirm(id, login);
	}
}
