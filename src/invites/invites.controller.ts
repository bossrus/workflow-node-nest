import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Post,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import {
	IInvitesObject,
	IInviteToJoin,
} from '@/dto-schemas-interfaces/inviteToJoin.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import { Auth } from '@/services/auth';

@Controller('invites')
export class InvitesController {
	constructor(private readonly inviteToJoinsService: InvitesService) {}

	/**
	 * Creates a new invite to join
	 * @param inviteToJoin - invite data
	 * @param login - login of the user creating the invite
	 * @returns the created invite
	 */
	@Post()
	@Auth()
	async createInviteToJoin(
		@Body() inviteToJoin: IInviteToJoin,
		@Headers('auth_login') login: string,
	): Promise<IInviteToJoin> {
		return this.inviteToJoinsService.createInviteToJoin(
			inviteToJoin,
			login,
		);
	}

	/**
	 * Finds an invites by ID
	 * @param id - ID of the user to whom the invites are intended
	 * @returns the found invites
	 */
	@Get()
	@Auth()
	async findInviteToJoinById(
		@Headers('auth_login') id: string,
	): Promise<IInvitesObject> {
		return this.inviteToJoinsService.findInviteToJoinById(id);
	}

	/**
	 * Deletes invite by ID
	 * @param id - ID of the invite
	 * @param login - login of the user deleting the invite
	 */
	@Delete(':id')
	@Auth()
	async deleteInviteToJoin(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.inviteToJoinsService.deleteInviteToJoin(id, login);
	}

	/**
	 * Clears all invites to join
	 * @param login - ID of the user clearing the invites addressed to them
	 */
	@Delete()
	@Auth()
	async clearInvitesToJoin(
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.inviteToJoinsService.clearInvitesToJoin(login);
	}
}
