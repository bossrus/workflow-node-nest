import { Injectable } from '@nestjs/common';
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

	/**
	 * Creates a new invite to join and logs the operation.
	 * @param createInviteToJoinDto - The invite data transfer object.
	 * @param login - The login of the user creating the invite.
	 * @returns The created invite.
	 */
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
		await this.notifyAndLog(
			'create',
			newInviteToJoin,
			login,
			createInviteToJoinDto.to,
		);
		return newInviteToJoin;
	}

	/**
	 * Finds invites to join by recipient ID.
	 * @param id - The recipient ID.
	 * @returns An object containing the invites.
	 */
	async findInviteToJoinById(id: string): Promise<IInvitesObject> {
		const inviteToJoin = await this.inviteToJoinModel.find(
			{
				to: id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		const data: IInvitesObject = {};
		inviteToJoin.forEach((invite) => {
			data[invite._id] = invite;
		});
		return data;
	}

	/**
	 * Deletes an invitation to join by invite ID and logs the operation.
	 * @param id - The invite ID.
	 * @param login - The login of the user performing the deletion.
	 */
	async deleteInviteToJoin(id: string, login: string): Promise<void> {
		const inviteToJoin = await this.inviteToJoinModel.findOne({ _id: id });
		if (inviteToJoin) {
			inviteToJoin.isDeleted = Date.now();
			await inviteToJoin.save();
			await this.notifyAndLog(
				'delete',
				inviteToJoin,
				login,
				inviteToJoin.to,
			);
		}
	}

	/**
	 * Clears all invites to join for a specific user.
	 * @param login - The login of the user whose invites are to be cleared.
	 */
	async clearInvitesToJoin(login: string): Promise<void> {
		const invitesToJoin = await this.inviteToJoinModel.find({ to: login });
		if (invitesToJoin.length > 0) {
			for (const invite of invitesToJoin) {
				await this.deleteInviteToJoin(invite._id, login);
			}
		}
	}

	/**
	 * Sends a websocket message and logs the operation.
	 * @param operation - The type of operation ('create' | 'edit' | 'delete').
	 * @param invite - The invite object.
	 * @param login - The login of the user performing the operation.
	 * @param recipientId - The ID of the recipient of the invite.
	 */
	private async notifyAndLog(
		operation: 'create' | 'edit' | 'delete',
		invite: IInviteToJoin,
		login: string,
		recipientId: string,
	): Promise<void> {
		const websocketOperation: Record<
			'create' | 'edit' | 'delete',
			'delete' | 'update'
		> = {
			create: 'update',
			edit: 'update',
			delete: 'delete',
		};

		if (operation != 'delete') {
			await this.websocket.sendMessage({
				bd: 'invites',
				operation: websocketOperation[operation],
				id: recipientId,
				version: 0,
			});
		}

		await this.logService.saveToLog({
			bd: 'invite',
			date: Date.now(),
			description: '',
			operation,
			idWorker: login,
			idSubject: invite._id.toString(),
		});
	}
}
