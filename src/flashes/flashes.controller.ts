import { Body, Controller, Delete, Get, Headers, Post } from '@nestjs/common';
import { FlashesService } from './flashes.service';
import { Auth } from '@/services/auth';
import { IFlashMessages } from '@/dto-schemas-interfaces/flashMessage.dto.schema';

@Controller('flashes')
export class FlashesController {
	constructor(private readonly flashsService: FlashesService) {}

	@Post()
	@Auth()
	async createFlash(
		@Body() flash: IFlashMessages,
		@Headers('auth_login') login: string,
	): Promise<IFlashMessages> {
		return this.flashsService.createFlash(flash, login);
	}

	@Get()
	@Auth()
	async findFlashById(
		@Headers('auth_login') login: string,
	): Promise<IFlashMessages[]> {
		return this.flashsService.findFlashById(login);
	}

	@Delete()
	@Auth()
	async deleteFlash(@Headers('auth_login') login: string): Promise<void> {
		return this.flashsService.deleteFlash(login);
	}
}
