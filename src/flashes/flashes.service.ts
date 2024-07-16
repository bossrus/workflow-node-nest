import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

	/**
	 * Creates a new flash message and logs the operation.
	 * @param createFlashDto - The flash message data transfer object.
	 * @param login - The login of the user creating the flash message.
	 * @returns The created flash message.
	 */
	async createFlash(
		createFlashDto: IFlashMessages,
		login: string,
	): Promise<IFlashMessages> {
		const newFlash = await this.flashModel.create(createFlashDto);
		await this.notifyAndLog('create', newFlash, login, createFlashDto.to);
		return newFlash;
	}

	/**
	 * Finds flash messages by the recipient's ID.
	 * @param id - The recipient's ID.
	 * @returns An array of flash messages.
	 */
	async findFlashById(id: string): Promise<IFlashMessages[]> {
		return this.flashModel.find(
			{
				to: id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
	}

	/**
	 * Deletes flash messages for a specific user and logs the operation.
	 * @param login - The login of the user whose flash messages are to be deleted.
	 */
	async deleteFlash(login: string): Promise<void> {
		const flashes = await this.flashModel.find({ to: login });
		if (flashes.length > 0) {
			for (const flash of flashes) {
				flash.isDeleted = Date.now();
				await flash.save();
				await this.notifyAndLog('delete', flash, login, login);
			}
		}
	}

	/**
	 * Sends a websocket message and logs the operation.
	 * @param operation - The type of operation ('create' | 'edit' | 'delete').
	 * @param flash - The flash message object.
	 * @param login - The login of the user performing the operation.
	 * @param recipientId - The ID of the recipient of the flash message.
	 */
	private async notifyAndLog(
		operation: 'create' | 'edit' | 'delete',
		flash: IFlashMessages,
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
				bd: 'flashes',
				operation: websocketOperation[operation],
				id: recipientId,
				version: 0,
			});
		}

		await this.logService.saveToLog({
			bd: 'flash',
			date: Date.now(),
			description: '',
			operation,
			idWorker: login,
			idSubject: flash._id.toString(),
		});
	}
}
