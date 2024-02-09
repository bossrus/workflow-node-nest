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
import { Model } from 'mongoose';
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
		await this.checkExist(
			createWorkflowDto.title,
			createWorkflowDto.titleSlug,
			createWorkflowDto.firm,
			createWorkflowDto.modification,
		);
		const newWorkflow = await this.workflowModel.create(createWorkflowDto);
		await this.websocket.sendMessage({
			bd: 'workflow',
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
		return newWorkflow;
	}

	async findAllWorkflows(): Promise<IWorkflow[]> {
		return this.workflowModel.find(
			{ isDeleted: null, isDone: null },
			DB_IGNORE_FIELDS,
		);
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
			throw new NotFoundException('Workflow not found');
		}
		return workflow;
	}

	async updateWorkflow(
		{ _id, ...updateWorkflow }: IWorkflowUpdate,
		login: string,
	): Promise<IWorkflow> {
		if (!_id) {
			throw new BadRequestException('Workflow _id is required');
		}
		const workflow = await this.workflowModel.findOne(
			{
				_id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!workflow) {
			throw new NotFoundException('Workflow not found');
		}
		const newWorkflow = {
			...workflow.toObject(),
			...updateWorkflow,
			version: workflow.version + 1,
		};
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
				bd: 'workflow',
				operation: 'update',
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
		// вспомогательный объект с ключами полей = _id
		const workflowLookup: IWorkflowsObject = workflows.reduce(
			(acc, workflow) => {
				acc[workflow._id] = workflow;
				return acc;
			},
			{},
		);
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
		await this.mailService.sendEmailNotificationPublish(
			workflowsByModificationAndFirms,
		);
		for (const id of workflowIDs) {
			const workflow = await this.updateWorkflow(
				{
					_id: id,
					isPublished: Date.now(),
				},
				login,
			);
			await this.logService.saveToLog({
				bd: 'workflow',
				date: Date.now(),
				description: '',
				operation: 'publish',
				idWorker: login,
				idSubject: workflow._id.toString(),
			});
		}
		return undefined;
	}

	async checkedWorkflow({ ids }: IMongoIdArray, login: string) {
		const workflows = await this.workflowModel
			.find({
				_id: { $in: ids },
				isDeleted: null,
				isDone: null,
				isPublished: null,
			})
			.sort('currentDepartment');
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
		return undefined;
	}

	async addToDescription(id: string, text: string, login: string) {
		const workflow = await this.findWorkflowById(id);
		const newDescription =
			workflow.description +
			'\n-----------------\n' +
			this.usersDBService.getName(login) +
			` (${Date.now()}):\n` +
			text;
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
				throw new BadRequestException(
					'You are already in this workflow',
				);
			}
			const newExecutors = workflow.executors.concat(login);
			await this.updateWorkflow(
				{
					_id: id,
					executors: newExecutors,
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
			newDepartment !== '9999' &&
			newDepartment &&
			!isValidMongodbId(newDepartment)
		)
			throw new BadRequestException('Wrong department id');
		const workflow = await this.findWorkflowById(id);
		let result =
			workflow.currentDepartment === newDepartment
				? 'Оставлен в том же отделе'
				: `Передав в отдел "${this.departmentsDBService.getTitle(newDepartment)}"`;
		if (newDepartment === '9999') result = 'Работа закончена';

		if (!workflow.executors.includes(login)) {
			throw new BadRequestException('You are not execute this workflow');
		}
		const newExecutors = workflow.executors.filter(
			(item) => item !== login,
		);
		const workflowUpdateFields: IWorkflowUpdate = {
			_id: id,
			executors: newExecutors,
		};
		if (result !== 'Оставлен в том же отделе') {
			workflowUpdateFields.currentDepartment = newDepartment;
		}
		if (newDepartment === '9999') {
			workflowUpdateFields.isDone = Date.now();
		}
		const newWorkflow = await this.updateWorkflow(
			workflowUpdateFields,
			login,
		);
		const user = this.usersDBService.getById(login);
		if (user.currentWorkflowInWork === id) {
			await this.userService.updateUser(
				{
					_id: login,
					currentWorkflowInWork: null,
				},
				login,
			);
		}

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
			workflow.isDeleted = Date.now();
			await workflow.save();
			await this.websocket.sendMessage({
				bd: 'workflow',
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
	): Promise<void> {
		const workflow = await this.workflowModel.findOne({
			$and: [
				{
					$or: [{ titleSlug }, { title }],
				},
				{ firm },
				{ modification },
			],
		});
		if (workflow) {
			throw new BadRequestException('Workflow already exists');
		}
	}
}
