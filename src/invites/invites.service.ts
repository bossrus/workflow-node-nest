import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	IInvitesObject,
	IInviteToJoin,
} from '@/dto-schemas-interfaces/inviteToJoin.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { LogService } from '@/log/log.service';
import { WebsocketService } from '@/websockets/websocket.service';
import { UsersDBService } from '@/BD/usersDB.service';

@Injectable()
export class InvitesService {
	constructor(
		@InjectModel(IInviteToJoin.name)
		private inviteToJoinModel: Model<IInviteToJoin>,
		private websocket: WebsocketService,
		private logService: LogService,
		private usersDBService: UsersDBService,
	) {}

	async createInviteToJoin(
		createInviteToJoinDto: IInviteToJoin,
		login: string,
	): Promise<IInviteToJoin> {
		const user = this.usersDBService.getById(login);
		const newInviteToJoin = await this.inviteToJoinModel.create({
			...createInviteToJoinDto,
			from: login,
			department: user.currentDepartment,
		});
		//если приходит сообщение проверить инвайт — то id — это не id инвайта, а id юзера
		await this.websocket.sendMessage({
			bd: 'invites',
			operation: 'update',
			id: createInviteToJoinDto.to,
			version: 0,
		});
		await this.logService.saveToLog({
			bd: 'invite',
			date: Date.now(),
			description: '',
			operation: 'create',
			idWorker: login,
			idSubject: newInviteToJoin._id.toString(),
		});
		return newInviteToJoin;
	}

	//ищем по адресату, а не по номеру приглашения
	async findInviteToJoinById(id: string): Promise<IInvitesObject> {
		const inviteToJoin = await this.inviteToJoinModel.find(
			{
				to: id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		// if (!inviteToJoin || inviteToJoin.length === 0) {
		// 	throw new NotFoundException(
		// 		'Приглашений для данного субъекта не существует',
		// 	);
		// }
		const data: IInvitesObject = {};
		inviteToJoin.forEach((invite) => {
			data[invite._id] = invite;
		});
		return data;
	}

	//удаляем по номеру приглашения, а не по адресату
	async deleteInviteToJoin(id: string, login: string): Promise<void> {
		const inviteToJoin = await this.inviteToJoinModel.findOne({ _id: id });
		console.log(inviteToJoin, '\nпришли удалять invite');
		if (inviteToJoin) {
			console.log('>>> и удалили, вроде');
			inviteToJoin.isDeleted = Date.now();
			await inviteToJoin.save();
			await this.logService.saveToLog({
				bd: 'invite',
				date: Date.now(),
				description: 'inviteToJoin',
				operation: 'delete',
				idWorker: login,
				idSubject: inviteToJoin._id.toString(),
			});
		}
	}

	async clearInvitesToJoin(login: string): Promise<void> {
		const invitesToJoin = await this.inviteToJoinModel.find({ to: login });
		if (invitesToJoin.length > 0) {
			for (const invite of invitesToJoin) {
				await this.deleteInviteToJoin(invite._id, login);
			}
		}
	}
}
