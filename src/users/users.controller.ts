import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
	Post,
	Redirect,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { IUser, IUserUpdate } from '@/dto-schemas-interfaces/user.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { IUsersDB } from '@/BD/usersDB.service';
import {
	CONTROL_PANEL_FRONT,
	WRONG_EMAIL_TOKEN_PAGE,
} from '@/consts/serveresAddresses';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	/**
	 * Logs in a user.
	 * @param loginUserDto - The user login data transfer object.
	 * @returns The logged-in user data.
	 */
	@Post('login')
	async loginUser(@Body() loginUserDto: IUserUpdate) {
		return this.usersService.loginUser(loginUserDto);
	}

	/**
	 * Update Users BD on server.
	 * @returns 'ok'
	 */
	@Get('update')
	@Auth('admin')
	async updateAllTypesOfWork(): Promise<string> {
		await this.usersService.onModuleInit();
		return 'ok';
	}

	/**
	 * Retrieves the authenticated user.
	 * @param login - The login header.
	 * @param token - The token header.
	 * @returns The authenticated user data.
	 */
	@Get('auth')
	@Auth()
	async getAuthUser(
		@Headers('authlogin') login: string,
		@Headers('authtoken') token: string,
	) {
		return this.usersService.getAuthUser(login, token);
	}

	/**
	 * Retrieves a user by ID for admin.
	 * @param id - The user ID.
	 * @returns The user data.
	 */
	@Get('admin/:id')
	@Auth('admin')
	async findUserByIdAdmin(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IUserUpdate> {
		return this.usersService.findUserByIdAdmin(id);
	}

	/**
	 * Retrieves all users for admin.
	 * @returns The list of all users.
	 */
	@Get('admin')
	@Auth('admin')
	async findAllUsersAdmin(): Promise<IUsersDB> {
		return this.usersService.findAllUsersAdmin();
	}

	/**
	 * Retrieves all users.
	 * @returns The list of all users.
	 */
	@Get()
	@Auth()
	async findAllUsers(): Promise<IUsersDB> {
		return this.usersService.findAllUsers();
	}

	/**
	 * Confirms a user's email.
	 * @param id - The user ID.
	 * @param token - The email confirmation token.
	 * @returns The redirection URL.
	 */
	@Get('confirmEmail/:id/:token')
	@Redirect()
	async confirmEmail(
		@Param('id', isValidIdPipe) id: string,
		@Param('token') token: string,
	): Promise<{ url: string }> {
		const relink = (await this.usersService.confirmEmail(id, token))
			? CONTROL_PANEL_FRONT
			: WRONG_EMAIL_TOKEN_PAGE;
		return { url: relink };
	}

	/**
	 * Retrieves a user by ID.
	 * @param id - The user ID.
	 * @returns The user data.
	 */
	@Get(':id')
	@Auth()
	async findUserById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IUserUpdate> {
		return this.usersService.findUserById(id);
	}

	/**
	 * Retrieves the authenticated user's data.
	 * @param id - The user ID.
	 * @param login - The login header.
	 * @returns The authenticated user's data.
	 */
	@Get('me/:id')
	@Auth()
	async showMe(
		@Param('id', isValidIdPipe) id: string,
		@Headers('authlogin') login: string,
	): Promise<IUserUpdate> {
		return this.usersService.showMe(id, login);
	}

	/**
	 * Updates a user.
	 * @param updateUserDto - The user update data transfer object.
	 * @param login - The login header.
	 * @returns The updated user data.
	 */
	@Patch()
	@Auth('admin')
	async updateUser(
		@Body() updateUserDto: IUserUpdate,
		@Headers('authlogin') login: string,
	): Promise<IUser> {
		return this.usersService.updateUser(updateUserDto, login);
	}

	/**
	 * Updates a user's email.
	 * @param updateUserDto - The user update data transfer object.
	 * @param login - The login header.
	 * @returns A boolean indicating the success of the operation.
	 */
	@Patch('email')
	@Auth()
	async updateUsersEmail(
		@Body() updateUserDto: IUserUpdate,
		@Headers('authlogin') login: string,
	): Promise<boolean> {
		return this.usersService.updateUsersEmail(updateUserDto, login);
	}

	/**
	 * Updates the authenticated user's data.
	 * @param updateUserDto - The user update data transfer object.
	 * @param login - The login header.
	 * @returns The updated user data.
	 */
	@Patch('me')
	@Auth()
	async updateMe(
		@Body() updateUserDto: IUserUpdate,
		@Headers('authlogin') login: string,
	): Promise<IUser> {
		return this.usersService.updateMe(updateUserDto, login);
	}

	/**
	 * Deletes a user.
	 * @param id - The user ID.
	 * @param login - The login header.
	 * @returns A promise that resolves when the user is deleted.
	 */
	@Delete(':id')
	@Auth('admin')
	async deleteUser(
		@Param('id', isValidIdPipe) id: string,
		@Headers('authlogin') login: string,
	): Promise<void> {
		return this.usersService.deleteUser(id, login);
	}
}
