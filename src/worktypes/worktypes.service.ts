import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	IWorktype,
	IWorktypeUpdate,
} from '@/dto-schemas-interfaces/worktype.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { IWorktypesDB, WorktypesDBService } from '@/BD/worktypesDB.service';
import { LogService } from '@/log/log.service';

@Injectable()
export class WorktypesService {
	constructor(
		@InjectModel(IWorktype.name)
		private worktypeModel: Model<IWorktype>,
		private websocket: WebsocketService,
		private worktypesDBService: WorktypesDBService,
		private logService: LogService,
	) {}

	async onModuleInit() {
		console.log('\tзагружаю worktypesDB');
		this.worktypesDBService.worktypes = await this.loadWorktypesFromBase();
	}

	async createWorktype(
		createWorktypeDto: IWorktype,
		login: string,
	): Promise<IWorktype> {
		await this.checkExist(createWorktypeDto.title);
		createWorktypeDto.titleSlug = makeSlug(createWorktypeDto.title);
		const newWorktype = await this.worktypeModel.create(createWorktypeDto);
		await this.websocket.sendMessage({
			bd: 'type',
			operation: 'update',
			id: newWorktype._id.toString(),
			version: newWorktype.version,
		});
		await this.logService.saveToLog({
			bd: 'type',
			date: Date.now(),
			description: '',
			operation: 'create',
			idWorker: login,
			idSubject: newWorktype._id.toString(),
		});
		this.worktypesDBService.setWorktype(newWorktype.toObject());
		return newWorktype;
	}

	async loadWorktypesFromBase() {
		return this.worktypeModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	async findAllWorktypes(): Promise<IWorktypesDB> {
		return this.worktypesDBService.worktypes;
	}

	findWorktypeById(id: string): IWorktype {
		return this.worktypesDBService.getById(id);
	}

	async updateWorktype(
		{ _id, ...updateWorktype }: IWorktypeUpdate,
		login: string,
	): Promise<IWorktype> {
		if (!_id) {
			return this.createWorktype(updateWorktype as IWorktype, login);
		}
		const worktype = await this.worktypeModel.findOne(
			{
				_id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!worktype) {
			throw new NotFoundException('Тип работы не существует');
		}
		const newWorktype = {
			...worktype.toObject(),
			...updateWorktype,
			version: worktype.version + 1,
		};
		if (updateWorktype.title) {
			await this.checkExist(updateWorktype.title);
			newWorktype.titleSlug = makeSlug(updateWorktype.title);
		}
		const savedWorktype = await this.worktypeModel
			.findOneAndUpdate(
				{
					_id,
					isDeleted: null,
				},
				newWorktype,
				{ new: true },
			)
			.select(DB_IGNORE_FIELDS)
			.lean();
		await this.websocket.sendMessage({
			bd: 'type',
			operation: 'update',
			id: savedWorktype._id.toString(),
			version: savedWorktype.version,
		});
		await this.logService.saveToLog({
			bd: 'type',
			date: Date.now(),
			description: '',
			operation: 'edit',
			idWorker: login,
			idSubject: savedWorktype._id.toString(),
		});
		this.worktypesDBService.setWorktype(savedWorktype);
		return savedWorktype;
	}

	async deleteWorktype(id: string, login: string): Promise<void> {
		const worktype = this.findWorktypeById(id);
		console.log(worktype, '\nпришли удалять worktype');
		if (worktype) {
			console.log('>>> и удалили, вроде');
			const dateOfDelete = Date.now();
			await this.worktypeModel.findByIdAndUpdate(id, {
				isDeleted: dateOfDelete,
			});
			await this.websocket.sendMessage({
				bd: 'type',
				operation: 'delete',
				id: worktype._id.toString(),
				version: worktype.version,
			});
			this.worktypesDBService.deleteWorktype(id);

			await this.logService.saveToLog({
				bd: 'type',
				date: Date.now(),
				description: '',
				operation: 'delete',
				idWorker: login,
				idSubject: worktype._id.toString(),
			});
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	private async checkExist(title: string): Promise<void> {
		const worktype = await this.worktypeModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (worktype) {
			throw new BadRequestException('Тип работы уже существует');
		}
	}
}
