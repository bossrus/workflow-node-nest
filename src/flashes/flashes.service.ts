import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { LogService } from '@/log/log.service';
import { IFlashMessages } from '@/dto-schemas-interfaces/flashMessage.dto.schema';
import { WebsocketService } from '@/websockets/websocket.service';

@Injectable()
export class FlashesService {
	constructor(
		@InjectModel(IFlashMessages.name)
		private flashModel: Model<IFlashMessages>,
		private websocket: WebsocketService,
		private logService: LogService,
	) {}

	async createFlash(
		createFlashDto: IFlashMessages,
		login: string,
	): Promise<IFlashMessages> {
		const newFlash = await this.flashModel.create(createFlashDto);
		//если приходит сообщение проверить flash — то id — это не id flash, а id юзера
		await this.websocket.sendMessage({
			bd: 'flash',
			operation: 'update',
			id: createFlashDto.to,
			version: 0,
		});

		await this.logService.saveToLog({
			bd: 'flash',
			date: Date.now(),
			description: '',
			operation: 'create',
			idWorker: login,
			idSubject: newFlash._id.toString(),
		});
		return newFlash;
	}

	async findFlashById(id: string): Promise<IFlashMessages[]> {
		const flash = await this.flashModel.find(
			{
				to: id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!flash || flash.length === 0) {
			throw new NotFoundException('Flash not found');
		}
		return flash;
	}

	async deleteFlash(login: string): Promise<void> {
		const flash = await this.flashModel.find({ to: login });
		console.log(flash, '\nпришли удалять flash');
		if (flash.length > 0) {
			flash.forEach(async (f) => {
				f.isDeleted = Date.now();
				await f.save();
				await this.logService.saveToLog({
					bd: 'flash',
					date: (f.isDeleted = Date.now()),
					description: '',
					operation: 'delete',
					idWorker: login,
					idSubject: f._id.toString(),
				});
			});
			console.log('>>> и удалили, вроде');
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	private async checkExist(title: string): Promise<void> {
		const flash = await this.flashModel.findOne({
			titleSlug: makeSlug(title),
		});
		if (flash) {
			throw new BadRequestException('Flash already exists');
		}
	}
}
