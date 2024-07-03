//src/workflows/workflows.service.ts
import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	IWorkflow,
	IWorkflowsObject,
	IWorkflowUpdate,
} from '@/dto-schemas-interfaces/workflow.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { LogService } from '@/log/log.service';
import { MailService } from '@/mail/mail.service';
import {
	IMailList,
	IMailListByDepartments,
} from '@/dto-schemas-interfaces/forMail';
import { WebsocketService } from '@/websockets/websocket.service';
import { DepartmentsDBService } from '@/BD/departmentsDB.service';
import { ModificationsDBService } from '@/BD/modificationsDB.service';
import { FirmsDBService } from '@/BD/firmsDB.service';
import { UsersDBService } from '@/BD/usersDB.service';
import { UsersService } from '@/users/users.service';
import { isValidMongodbId } from '@/services/_mongodb_id_valiator';
import { IMongoIdArray } from '@/dto-schemas-interfaces/mongoIds.dto.schema';
import { IStatParameters } from '@/dto-schemas-interfaces/statistic.interface';

@Injectable()
export class WorkflowsService {
	constructor(
		@InjectModel(IWorkflow.name)
		private workflowModel: Model<IWorkflow>,
		private websocket: WebsocketService,
		private logService: LogService,
		private mailService: MailService,
		private departmentsDBService: DepartmentsDBService,
		private modificationsDBService: ModificationsDBService,
		private firmDBService: FirmsDBService,
		private usersDBService: UsersDBService,
		private userService: UsersService,
	) {}

	async createWorkflow(
		createWorkflowDto: IWorkflow,
		login: string,
	): Promise<IWorkflow> {
		createWorkflowDto.titleSlug = makeSlug(createWorkflowDto.title);
		console.log('проверка', createWorkflowDto);
		if (!createWorkflowDto.mainId) {
			await this.checkExist(
				createWorkflowDto.title,
				createWorkflowDto.titleSlug,
				createWorkflowDto.firm,
				createWorkflowDto.modification,
			);
		}
		console.log('\t после проверки');
		createWorkflowDto.whoAddThisWorkflow = login;
		const newWorkflow = await this.workflowModel.create(createWorkflowDto);
		await this.websocket.sendMessage({
			bd: 'workflows',
			operation: 'update',
			id: newWorkflow._id.toString(),
			version: newWorkflow.version,
		});
		await this.logService.saveToLog({
			bd: 'workflow',
			date: Date.now(),
			description: '',
			operation: 'create',
			idWorker: login,
			idSubject: newWorkflow._id.toString(),
		});
		console.log('при создании воркфлоу id = ', newWorkflow._id);
		return newWorkflow;
	}

	async findAllWorkflows(): Promise<IWorkflowsObject> {
		const resultArr = await this.workflowModel.find(
			{ isDeleted: null, isDone: null },
			DB_IGNORE_FIELDS,
		);
		const result: IWorkflowsObject = {};
		resultArr.forEach((workflow) => {
			result[workflow._id] = workflow;
		});
		return result;
	}

	async findAllWorkflowsInThisModification({
		firm,
		modification,
	}: IWorkflowUpdate): Promise<IWorkflow[]> {
		const result = await this.workflowModel.find(
			{
				$expr: { $eq: [{ $toString: '$_id' }, '$mainId'] },
				firm: firm,
				modification: modification,
				isDeleted: null,
			},
			'_id title',
		);
		console.log('\tрезультат поиска в модификации', result);
		return result;
	}

	async findWorkflowById(id: string): Promise<IWorkflow> {
		const workflow = await this.workflowModel.findOne(
			{
				_id: id,
				isDeleted: null,
				isDone: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!workflow) {
			throw new NotFoundException('Нет такой работы');
		}
		return workflow;
	}

	async updateWorkflow(
		{ _id, ...updateWorkflow }: IWorkflowUpdate,
		login: string,
	): Promise<IWorkflow> {
		if (!_id) {
			return this.createWorkflow(updateWorkflow as IWorkflow, login);
		}
		const workflow = await this.workflowModel.findOne(
			{
				_id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!workflow) {
			throw new NotFoundException('Нет такой работы');
		}
		const newWorkflow = {
			...workflow.toObject(),
			...updateWorkflow,
			version: workflow.version + 1,
		};
		console.log('проверка', newWorkflow);
		if (updateWorkflow.title) {
			const firm = updateWorkflow.firm || workflow.firm;
			const modification =
				updateWorkflow.modification || workflow.modification;
			newWorkflow.titleSlug = makeSlug(updateWorkflow.title);
			await this.checkExist(
				updateWorkflow.title,
				newWorkflow.titleSlug,
				firm,
				modification,
				workflow._id,
			);
		}

		const savedWorkflow = await this.workflowModel
			.findOneAndUpdate(
				{
					_id,
					isDeleted: null,
				},
				newWorkflow,
				{ new: true },
			)
			.select(DB_IGNORE_FIELDS);

		if (
			savedWorkflow.isPublished &&
			updateWorkflow.currentDepartment &&
			updateWorkflow.currentDepartment !== workflow.currentDepartment
		) {
			await this.mailService.sendEmailNotification(
				savedWorkflow.currentDepartment,
				savedWorkflow.title,
				savedWorkflow.firm,
				savedWorkflow.modification,
				savedWorkflow.countPictures,
			);
		}
		if (
			!(
				Object.keys(updateWorkflow).length == 1 &&
				'isCheckedOnStat' in updateWorkflow
			)
		) {
			await this.websocket.sendMessage({
				bd: 'workflows',
				operation: updateWorkflow.isDone ? 'delete' : 'update',
				id: savedWorkflow._id.toString(),
				version: savedWorkflow.version,
			});
		}

		if (
			!(
				'isPublished' in updateWorkflow ||
				(Object.keys(updateWorkflow).length == 1 &&
					'description' in updateWorkflow) ||
				(Object.keys(updateWorkflow).length == 1 &&
					'executors' in updateWorkflow) ||
				(Object.keys(updateWorkflow).length == 1 &&
					'isCheckedOnStat' in updateWorkflow)
			)
		) {
			await this.logService.saveToLog({
				bd: 'department',
				date: Date.now(),
				description: '',
				operation: 'edit',
				idWorker: login,
				idSubject: savedWorkflow._id.toString(),
			});
		}
		return savedWorkflow;
	}

	async publishWorkflow({ ids }: IMongoIdArray, login: string) {
		const workflows = await this.workflowModel
			.find({
				_id: { $in: ids },
				isDeleted: null,
				isDone: null,
				isPublished: null,
			})
			.sort('currentDepartment');

		const workflowLookup: IWorkflowsObject = {};

		for (const wrk of workflows) {
			const workflow = await this.updateWorkflow(
				{
					_id: wrk._id,
					isPublished: Date.now(),
				},
				login,
			);
			workflowLookup[workflow._id] = workflow;
			await this.logService.saveToLog({
				bd: 'workflow',
				date: Date.now(),
				description: '',
				operation: 'publish',
				idWorker: login,
				idSubject: workflow._id.toString(),
			});
		}

		const workflowsByModificationAndFirms: IMailListByDepartments = {};
		let workflowIDs: string[] = [];
		let oldDepartmentId: string = workflows[0].currentDepartment;
		workflows.forEach((workflow) => {
			if (oldDepartmentId == workflow.currentDepartment) {
				workflowIDs.push(workflow._id.toString());
			} else {
				workflowsByModificationAndFirms[
					this.departmentsDBService.getTitle(oldDepartmentId)
				] = {
					departmentId: oldDepartmentId,
					mailList: this.getMailList(workflowIDs, workflowLookup),
				};
				oldDepartmentId = workflow.currentDepartment;
				workflowIDs = [workflow._id.toString()];
			}
		});
		if (
			!(
				this.departmentsDBService.getTitle(oldDepartmentId) in
				workflowsByModificationAndFirms
			)
		) {
			workflowsByModificationAndFirms[
				this.departmentsDBService.getTitle(oldDepartmentId)
			] = {
				departmentId: oldDepartmentId,
				mailList: this.getMailList(workflowIDs, workflowLookup),
			};
		}
		//тут не должно быть евейта! мы не ждём, когда пройдёт оповещение по почте.
		this.mailService.sendEmailNotificationPublish(
			workflowsByModificationAndFirms,
		);

		return 'publish done';
	}

	async checkedWorkflow({ ids }: IMongoIdArray, login: string) {
		const workflows = await this.workflowModel.find({
			_id: { $in: ids },
			isDeleted: null,
			isPublished: { $ne: null },
		});
		for (const work of workflows) {
			const workflow = await this.updateWorkflow(
				{
					_id: work._id,
					isCheckedOnStat: Date.now(),
				},
				login,
			);
			await this.logService.saveToLog({
				bd: 'workflow',
				date: Date.now(),
				description: '',
				operation: 'check',
				idWorker: login,
				idSubject: workflow._id.toString(),
			});
		}
		return 'checked done';
	}

	createNewDescription(description: string, newInfo: string, login: string) {
		const currentDate = new Date();
		const formattedDate = currentDate
			.toLocaleString('ru-RU', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hourCycle: 'h24', // для 24-часового формата времени
			})
			.replace(/\//g, '.'); // заменяем / на .
		return (
			description +
			'\n\n>>> ' +
			this.usersDBService.getName(login) +
			` (${formattedDate}):\n  ` +
			newInfo
		);
	}

	async addToDescription(id: string, textin_param, login: string) {
		const text = textin_param.text;
		console.log('\n', text, '\n');
		const workflow = await this.findWorkflowById(id);
		const newDescription = this.createNewDescription(
			workflow.description,
			text,
			login,
		);
		const newWorkflow = await this.updateWorkflow(
			{
				_id: id,
				description: newDescription,
			},
			login,
		);
		await this.logService.saveToLog({
			bd: 'workflow',
			date: Date.now(),
			description: '',
			operation: 'add_to_description',
			idWorker: login,
			idSubject: workflow._id.toString(),
		});

		return newWorkflow;
	}

	async takeToWork({ ids }: IMongoIdArray, login: string) {
		for (const id of ids) {
			const workflow = await this.findWorkflowById(id);
			if (workflow.executors.includes(login)) {
				return true;
			}
			const newExecutors = workflow.executors.concat(login);
			const newDescription = this.createNewDescription(
				workflow.description,
				'Начал работу',
				login,
			);
			await this.updateWorkflow(
				{
					_id: id,
					executors: newExecutors,
					description: newDescription,
				},
				login,
			);
			const user = this.usersDBService.getById(login);
			if (!user.currentWorkflowInWork) {
				await this.userService.updateUser(
					{
						_id: login,
						currentWorkflowInWork: id,
					},
					login,
				);
			}
			await this.logService.saveToLog({
				bd: 'workflow',
				date: Date.now(),
				description: '',
				operation: 'take',
				idWorker: login,
				idSubject: id,
			});
		}
		return true;
	}

	async closeWork(id: string, login: string, newDepartment?: string) {
		if (
			newDepartment &&
			newDepartment !== 'closeWork' &&
			newDepartment !== 'justClose' &&
			!isValidMongodbId(newDepartment)
		)
			throw new BadRequestException('Неверный ID работы');
		const workflow = await this.findWorkflowById(id);

		const DONE_WORK_BUT_NOT_CHANGE_DEPARTMENT =
			'Работа завершена, но заказ оставлен в том же отделе';
		const DONE_HALF_WORK = 'Работа над своей частью заказа завершена';
		const WORK_CLOSE = 'Заказ закрыт';

		let result = '';
		switch (true) {
			case workflow.currentDepartment === newDepartment:
				result = DONE_WORK_BUT_NOT_CHANGE_DEPARTMENT;
				break;
			case newDepartment === 'closeWork':
				result = WORK_CLOSE;
				break;
			case newDepartment === 'justClose':
				result = DONE_HALF_WORK;
				break;
			case newDepartment !== 'closeWork' && newDepartment !== 'justClose':
				result = `Работа завершена и заказ передан в отдел "${this.departmentsDBService.getTitle(newDepartment)}"`;
				break;
		}

		const newExecutors = workflow.executors.filter(
			(item) => item !== login,
		);
		const newDescription = this.createNewDescription(
			workflow.description,
			result,
			login,
		);
		const workflowUpdateFields: IWorkflowUpdate = {
			_id: id,
			executors: newExecutors,
			description: newDescription,
		};
		if (
			result !== DONE_WORK_BUT_NOT_CHANGE_DEPARTMENT &&
			result !== DONE_HALF_WORK &&
			result !== WORK_CLOSE
		) {
			workflowUpdateFields.currentDepartment = newDepartment;
		}
		if (newDepartment === 'closeWork') {
			workflowUpdateFields.isDone = Date.now();
		}
		const newWorkflow = await this.updateWorkflow(
			workflowUpdateFields,
			login,
		);
		await this.userService.updateUser(
			{
				_id: login,
				currentWorkflowInWork: null,
			},
			login,
		);

		await this.websocket.sendMessage({
			bd: 'users',
			operation: 'update',
			id: login,
			version: -1,
		});

		await this.logService.saveToLog({
			bd: 'workflow',
			date: Date.now(),
			description: result,
			operation: 'close',
			idWorker: login,
			idSubject: id,
		});

		return newWorkflow;
	}

	async deleteWorkflow(id: string, login: string): Promise<void> {
		const workflow = await this.workflowModel.findOne({ _id: id });
		console.log(workflow, '\nпришли удалять workflow');
		if (workflow) {
			console.log('>>> и удалили, вроде');
			workflow.title = workflow.title + Date.now().toString();
			workflow.titleSlug = workflow.titleSlug + Date.now().toString();
			workflow.isDeleted = Date.now();
			await workflow.save();
			await this.websocket.sendMessage({
				bd: 'workflows',
				operation: 'delete',
				id: workflow._id.toString(),
				version: workflow.version,
			});

			await this.logService.saveToLog({
				bd: 'workflow',
				date: Date.now(),
				description: '',
				operation: 'delete',
				idWorker: login,
				idSubject: workflow._id.toString(),
			});
		}
	}

	private getMailList(
		workflowIDs: string[],
		workflowLookup: IWorkflowsObject,
	) {
		const mailList: IMailList = {};
		workflowIDs.sort((a, b) => {
			const workflowA = workflowLookup[a];
			const workflowB = workflowLookup[b];

			if (workflowA.modification < workflowB.modification) {
				return -1;
			}
			if (workflowA.modification > workflowB.modification) {
				return 1;
			}

			if (workflowA.firm < workflowB.firm) {
				return -1;
			}
			if (workflowA.firm > workflowB.firm) {
				return 1;
			}

			return 0;
		});
		let oldModification: string =
			workflowLookup[workflowIDs[0]].modification;
		let oldFirm: string = workflowLookup[workflowIDs[0]].firm;
		let titles: string[] = [];
		workflowIDs.forEach((workflowId) => {
			if (
				oldModification ==
					workflowLookup[workflowIDs[0]].modification &&
				oldFirm === workflowLookup[workflowIDs[0]].firm
			) {
				titles.push(
					`${workflowLookup[workflowId].title} (картинок — ${workflowLookup[workflowId].countPictures} шт.)`,
				);
			} else {
				mailList[oldModification + oldFirm] = {
					modificationTitle:
						this.modificationsDBService.getTitle(oldModification),
					firmTitle: this.firmDBService.getTitle(oldFirm),
					titles,
				};
				oldModification = workflowLookup[workflowIDs[0]].modification;
				oldFirm = workflowLookup[workflowIDs[0]].firm;
				titles = [workflowLookup[workflowId].title];
			}
		});
		if (!(oldModification + oldFirm in mailList)) {
			mailList[oldModification + oldFirm] = {
				modificationTitle:
					this.modificationsDBService.getTitle(oldModification),
				firmTitle: this.firmDBService.getTitle(oldFirm),
				titles,
			};
		}
		return mailList;
	}

	getListForStat(statParameters: IStatParameters): Promise<IWorkflow[]> {
		const query: any = {
			isDeleted: null,
			isPublished: { $ne: null },
		};

		if (statParameters.firm) {
			query.firm = statParameters.firm;
		}
		if (statParameters.modification) {
			query.modification = statParameters.modification;
		}

		if (statParameters.dateFrom && statParameters.dateTo) {
			query.isPublished = {
				$gte: statParameters.dateFrom,
				$lte: statParameters.dateTo,
			};
		}

		if (statParameters.showChecked && !statParameters.showUnchecked) {
			query.isCheckedOnStat = { $exists: true, $ne: false };
		} else if (
			!statParameters.showChecked &&
			statParameters.showUnchecked
		) {
			query.$or = [
				{ isCheckedOnStat: false },
				{ isCheckedOnStat: { $exists: false } },
			];
		}

		console.log('запрос = ', query);

		return this.workflowModel.find(query);
	}

	getWorkflowDetails(id: string): Promise<IWorkflow[]> {
		const query: any = {
			isDeleted: null,
			mainId: id,
		};

		console.log('запрос = ', query);

		return this.workflowModel.find(query);
	}

	showStatistic(statParameters: IStatParameters, id: string) {
		console.log('\ni = ', id, '\nstatParameters:', statParameters);
		return id != undefined
			? this.getWorkflowDetails(id)
			: this.getListForStat(statParameters);
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	private async checkExist(
		title: string,
		titleSlug: string,
		firm: string,
		modification: string,
		id?: string,
	): Promise<void> {
		const workflows = await this.workflowModel.aggregate([
			{
				$match: {
					$and: [
						{
							$or: [{ titleSlug }, { title }],
						},
						{ firm },
						{ modification },
					],
				},
			},
			{
				$addFields: {
					isSameMainId: { $eq: ['$_id', '$mainId'] },
					isNotSameId: {
						$ne: [
							'$_id',
							new Types.ObjectId(
								id || '000000000000000000000000',
							),
						],
					},
				},
			},
			{
				$match: {
					$and: [{ isSameMainId: true }, { isNotSameId: true }],
				},
			},
		]);

		if (workflows.length > 0) {
			throw new BadRequestException('Такая работа уже существует');
		}
	}
}
