import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	ITypeOfWork,
	ITypeOfWorkUpdate,
} from '@/dto-schemas-interfaces/typeOfWork.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import {
	ITypesOfWorkDB,
	TypesOfWorkDBService,
} from '@/BD/typesOfWorkDB.service';
import { LogService } from '@/log/log.service';

@Injectable()
export class TypesOfWorkService {
	constructor(
		@InjectModel(ITypeOfWork.name)
		private typeOfWorkModel: Model<ITypeOfWork>,
		private websocket: WebsocketService,
		private typesOfWorkDBService: TypesOfWorkDBService,
		private logService: LogService,
	) {}

	async onModuleInit() {
		console.log('\tзагружаю typesOfWorkDB');
		this.typesOfWorkDBService.typesOfWork =
			await this.loadTypesOfWorkFromBase();
	}

	async createTypeOfWork(
		createTypeOfWorkDto: ITypeOfWork,
		login: string,
	): Promise<ITypeOfWork> {
		await this.checkExist(createTypeOfWorkDto.title);
		createTypeOfWorkDto.titleSlug = makeSlug(createTypeOfWorkDto.title);
		const newTypeOfWork =
			await this.typeOfWorkModel.create(createTypeOfWorkDto);
		await this.websocket.sendMessage({
			bd: 'typesOfWork',
			operation: 'update',
			id: newTypeOfWork._id.toString(),
			version: newTypeOfWork.version,
		});
		await this.logService.saveToLog({
			bd: 'type',
			date: Date.now(),
			description: '',
			operation: 'create',
			idWorker: login,
			idSubject: newTypeOfWork._id.toString(),
		});
		this.typesOfWorkDBService.setTypeOfWork(newTypeOfWork.toObject());
		return newTypeOfWork;
	}

	async loadTypesOfWorkFromBase() {
		return this.typeOfWorkModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	async findAllTypesOfWork(): Promise<ITypesOfWorkDB> {
		return this.typesOfWorkDBService.typesOfWork;
	}

	findTypeOfWorkById(id: string): ITypeOfWork {
		return this.typesOfWorkDBService.getById(id);
	}

	async updateTypeOfWork(
		{ _id, ...updateTypeOfWork }: ITypeOfWorkUpdate,
		login: string,
	): Promise<ITypeOfWork> {
		if (!_id) {
			return this.createTypeOfWork(
				updateTypeOfWork as ITypeOfWork,
				login,
			);
		}
		const typeOfWork = await this.typeOfWorkModel.findOne(
			{
				_id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!typeOfWork) {
			throw new NotFoundException('Тип работы не существует');
		}
		const newTypeOfWork = {
			...typeOfWork.toObject(),
			...updateTypeOfWork,
			version: typeOfWork.version + 1,
		};
		if (updateTypeOfWork.title) {
			await this.checkExist(updateTypeOfWork.title);
			newTypeOfWork.titleSlug = makeSlug(updateTypeOfWork.title);
		}
		const savedTypeOfWork = await this.typeOfWorkModel
			.findOneAndUpdate(
				{
					_id,
					isDeleted: null,
				},
				newTypeOfWork,
				{ new: true },
			)
			.select(DB_IGNORE_FIELDS)
			.lean();
		await this.websocket.sendMessage({
			bd: 'typesOfWork',
			operation: 'update',
			id: savedTypeOfWork._id.toString(),
			version: savedTypeOfWork.version,
		});
		await this.logService.saveToLog({
			bd: 'type',
			date: Date.now(),
			description: '',
			operation: 'edit',
			idWorker: login,
			idSubject: savedTypeOfWork._id.toString(),
		});
		this.typesOfWorkDBService.setTypeOfWork(savedTypeOfWork);
		return savedTypeOfWork;
	}

	async deleteTypeOfWork(id: string, login: string): Promise<void> {
		const typeOfWork = this.findTypeOfWorkById(id);
		console.log(typeOfWork, '\nпришли удалять typeOfWork');
		if (typeOfWork) {
			console.log('>>> и удалили, вроде');
			const dateOfDelete = Date.now();
			await this.typeOfWorkModel.findByIdAndUpdate(id, {
				isDeleted: dateOfDelete,
			});
			await this.websocket.sendMessage({
				bd: 'typesOfWork',
				operation: 'delete',
				id: typeOfWork._id.toString(),
				version: typeOfWork.version,
			});
			this.typesOfWorkDBService.deleteTypeOfWork(id);

			await this.logService.saveToLog({
				bd: 'type',
				date: Date.now(),
				description: '',
				operation: 'delete',
				idWorker: login,
				idSubject: typeOfWork._id.toString(),
			});
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	private async checkExist(title: string): Promise<void> {
		const typeOfWork = await this.typeOfWorkModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (typeOfWork) {
			throw new BadRequestException('Тип работы уже существует');
		}
	}
}
