import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import { FirmsService } from './firms.service';
import { IFirm, IFirmUpdate } from '@/dto-schemas-interfaces/firm.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';

@Controller('firms')
export class FirmsController {
	constructor(private readonly firmsService: FirmsService) {}

	@Post()
	@Auth('admin')
	async createFirm(
		@Body() firm: IFirm,
		@Headers('auth_login') login: string,
	): Promise<IFirm> {
		return this.firmsService.createFirm(firm, login);
	}

	@Get()
	@Auth()
	async findAllFirms(): Promise<IFirm[]> {
		return this.firmsService.findAllFirms();
	}

	@Get(':id')
	@Auth()
	async findFirmById(@Param('id', isValidIdPipe) id: string): Promise<IFirm> {
		return this.firmsService.findFirmById(id);
	}

	@Patch()
	@Auth('admin')
	async updateFirm(
		@Body() updateFirmDto: IFirmUpdate,
		@Headers('auth_login') login: string,
	): Promise<IFirm> {
		return this.firmsService.updateFirm(updateFirmDto, login);
	}

	@Delete(':id')
	@Auth('admin')
	async deleteFirm(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.firmsService.deleteFirm(id, login);
	}
}
