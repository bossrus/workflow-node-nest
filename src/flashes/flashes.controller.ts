import { Body, Controller, Delete, Get, Headers, Post } from '@nestjs/common';
import { FlashesService } from './flashes.service';
import { Auth } from '@/services/auth';
import { IFlashMessages } from '@/dto-schemas-interfaces/flashMessage.dto.schema';

@Controller('flashes')
export class FlashesController {
	constructor(private readonly flashesService: FlashesService) {}

	/**
	 * Creates a new flash message.
	 * @param flash - The flash message data transfer object.
	 * @param login - The login of the user creating the flash message.
	 * @returns The created flash message.
	 */
	@Post()
	@Auth()
	async createFlash(
		@Body() flash: IFlashMessages,
		@Headers('authlogin') login: string,
	): Promise<IFlashMessages> {
		return this.flashesService.createFlash(flash, login);
	}

	/**
	 * Retrieves flash messages for the logged-in user.
	 * @param login - The login of the user whose flash messages are to be retrieved.
	 * @returns An array of flash messages.
	 */
	@Get()
	@Auth()
	async findFlashById(
		@Headers('authlogin') login: string,
	): Promise<IFlashMessages[]> {
		return this.flashesService.findFlashById(login);
	}

	/**
	 * Deletes flash messages for the logged-in user.
	 * @param login - The login of the user whose flash messages are to be deleted.
	 * @returns A promise that resolves when the operation is complete.
	 */
	@Delete()
	@Auth()
	async deleteFlash(@Headers('authlogin') login: string): Promise<void> {
		return this.flashesService.deleteFlash(login);
	}
}
