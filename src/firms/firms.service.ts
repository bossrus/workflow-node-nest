import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { IFirm, IFirmUpdate } from '@/dto-schemas-interfaces/firm.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { FirmsDBService, IFirmsDB } from '@/BD/firmsDB.service';
import { LogService } from '@/log/log.service';

@Injectable()
export class FirmsService {
	constructor(
		@InjectModel(IFirm.name)
		private firmModel: Model<IFirm>,
		private websocket: WebsocketService,
		private firmsDBService: FirmsDBService,
		private logService: LogService,
	) {}

	async onModuleInit() {
		console.log('\tзагружаю firmsDB');
		this.firmsDBService.firms = await this.loadFirmsFromBase();
	}

	async createFirm(createFirmDto: IFirm, login: string): Promise<IFirm> {
		await this.checkExist(createFirmDto.title);
		createFirmDto.titleSlug = makeSlug(createFirmDto.title);
		const newFirm = await this.firmModel.create(createFirmDto);
		await this.websocket.sendMessage({
			bd: 'firm',
			operation: 'update',
			id: newFirm._id.toString(),
			version: newFirm.version,
		});
		await this.logService.saveToLog({
			bd: 'firm',
			date: Date.now(),
			description: '',
			operation: 'create',
			idWorker: login,
			idSubject: newFirm._id.toString(),
		});
		this.firmsDBService.setFirm(newFirm.toObject());
		return newFirm;
	}

	async loadFirmsFromBase() {
		return this.firmModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	async findAllFirms(): Promise<IFirmsDB> {
		return this.firmsDBService.firms;
	}

	findFirmById(id: string): IFirm {
		return this.firmsDBService.getById(id);
	}

	async updateFirm(
		{ _id, ...updateFirm }: IFirmUpdate,
		login: string,
	): Promise<IFirm> {
		if (!_id) {
			throw new BadRequestException('Firm _id is required');
		}
		const firm = await this.firmModel.findOne(
			{
				_id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!firm) {
			throw new NotFoundException('Firm not found');
		}
		const newFirm = {
			...firm.toObject(),
			...updateFirm,
			version: firm.version + 1,
		};
		if (updateFirm.title) {
			await this.checkExist(updateFirm.title);
			newFirm.titleSlug = makeSlug(updateFirm.title);
		}
		const savedFirm = await this.firmModel
			.findOneAndUpdate(
				{
					_id,
					isDeleted: null,
				},
				newFirm,
				{ new: true },
			)
			.select(DB_IGNORE_FIELDS)
			.lean();
		await this.websocket.sendMessage({
			bd: 'firm',
			operation: 'update',
			id: savedFirm._id.toString(),
			version: savedFirm.version,
		});
		await this.logService.saveToLog({
			bd: 'firm',
			date: Date.now(),
			description: '',
			operation: 'edit',
			idWorker: login,
			idSubject: savedFirm._id.toString(),
		});
		this.firmsDBService.setFirm(savedFirm);
		return savedFirm;
	}

	async deleteFirm(id: string, login: string): Promise<void> {
		const firm = this.findFirmById(id);
		console.log(firm, '\nпришли удалять firm');
		if (firm) {
			console.log('>>> и удалили, вроде');
			const dateOfDelete = Date.now();
			await this.firmModel.findByIdAndUpdate(id, {
				isDeleted: dateOfDelete,
			});
			await this.websocket.sendMessage({
				bd: 'firm',
				operation: 'delete',
				id: firm._id.toString(),
				version: firm.version,
			});
			this.firmsDBService.deleteFirm(id);
			await this.logService.saveToLog({
				bd: 'firm',
				date: Date.now(),
				description: '',
				operation: 'delete',
				idWorker: login,
				idSubject: firm._id.toString(),
			});
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	private async checkExist(title: string): Promise<void> {
		const firm = await this.firmModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (firm) {
			throw new BadRequestException('Firm already exists');
		}
	}
}
