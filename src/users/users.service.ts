import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { compare, genSalt, hash } from 'bcrypt';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { IUser, IUserUpdate } from '@/dto-schemas-interfaces/user.dto.schema';
import { IUsersDB, UsersDBService } from '@/BD/usersDB.service';
import { MailService } from '@/mail/mail.service';
import { MAIN_SERVER } from '@/consts/serveresAddresses';
import { LogService } from '@/log/log.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(IUser.name)
		private userModel: Model<IUser>,
		private websocket: WebsocketService,
		private usersDBService: UsersDBService,
		private mailService: MailService,
		private logService: LogService,
	) {}

	/**
	 * Initializes the module and loads users from the database.
	 */
	async onModuleInit() {
		this.usersDBService.users = await this.loadUsersFromBase();
	}

	/**
	 * Loads users from the database.
	 */
	async loadUsersFromBase() {
		return this.userModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	/**
	 * Creates a new user.
	 * @param createUserDto - The user data transfer object.
	 * @param login - The login of the user performing the operation.
	 */
	async createUser(createUserDto: IUser, login: string): Promise<IUser> {
		await this.checkExist(createUserDto.login);
		createUserDto.loginSlug = makeSlug(createUserDto.login);
		createUserDto.password = await this.hashPassword(
			createUserDto.password,
		);
		if (
			!createUserDto.currentDepartment ||
			!createUserDto.departments.includes(createUserDto.currentDepartment)
		)
			createUserDto.currentDepartment = createUserDto.departments[0];
		const newUser = await this.userModel.create(createUserDto);
		await this.notifyAndLog('create', newUser, login);
		this.usersDBService.setUser(newUser.toObject());
		return newUser;
	}

	/**
	 * Finds all users for admin.
	 */
	findAllUsersAdmin(): IUsersDB {
		return this.usersDBService.users;
	}

	/**
	 * Finds all users.
	 */
	findAllUsers(): IUsersDB {
		return this.usersDBService.usersShort;
	}

	/**
	 * Finds a user by ID for admin.
	 * @param id - The ID of the user.
	 */
	findUserByIdAdmin(id: string) {
		return this.usersDBService.getById(id);
	}

	/**
	 * Finds a user by ID.
	 * @param id - The ID of the user.
	 */
	findUserById(id: string) {
		return this.usersDBService.getByIdShort(id);
	}

	/**
	 * Shows the user details if the login matches the ID.
	 * @param id - The ID of the user.
	 * @param login - The login of the user.
	 */
	showMe(id: string, login: string) {
		if (login === id) {
			return this.findUserByIdAdmin(id);
		}
	}

	/**
	 * Updates the user's email.
	 * @param updateUser - The user update data transfer object.
	 * @param _id - The user id from data transfer object.
	 * @param login - The login of the user performing the operation.
	 */
	async updateUsersEmail({ _id, ...updateUser }: IUserUpdate, login: string) {
		if (!_id) {
			throw new BadRequestException('User _id is required');
		}
		if (_id !== login) {
			throw new BadRequestException(
				"you can't add an email to someone else's account",
			);
		}
		if (updateUser.email) {
			const emailToken = makeSlug(await genSalt(13));
			const emailConfirmed = false;
			const user = await this.userModel.findOneAndUpdate(
				{ _id },
				{
					$set: {
						email: updateUser.email,
						emailToken,
						emailConfirmed,
					},
				},
			);
			if (user) {
				await this.updateUser(
					{
						_id: _id.toString(),
						email: updateUser.email,
						emailToken,
						emailConfirmed,
					},
					login,
				);
				await this.mailService.sendEmailConfirmation(
					updateUser.email,
					this.usersDBService.getName(_id),
					`${MAIN_SERVER}/users/confirmEmail/${_id}/${emailToken}`,
				);
				await this.logService.saveToLog({
					bd: 'user',
					date: Date.now(),
					description: 'add email',
					operation: 'edit',
					idWorker: login,
					idSubject: _id,
				});
				return true;
			}
		} else {
			await this.clearEmail(_id);
			return true;
		}
		return false;
	}

	/**
	 * Updates the user's own data.
	 * @param updateUser - The user update data transfer object.
	 * @param _id - The user id from data transfer object.
	 * @param login - The login of the user performing the operation.
	 */
	async updateMe({ _id, ...updateUser }: IUserUpdate, login: string) {
		if (!_id) {
			throw new BadRequestException('User _id is required');
		}
		if (_id !== login) {
			throw new BadRequestException(
				"you can't change someone else's account",
			);
		}
		const user = await this.userModel.findOneAndUpdate(
			{ _id },
			{
				$set: {
					...updateUser,
				},
			},
		);
		if (user) {
			const savedUser = await this.updateUser(
				{
					_id: _id.toString(),
					...updateUser,
				},
				login,
			);
			await this.notifyAndLog('edit', savedUser, login, 'update me');
			return savedUser;
		}
	}

	/**
	 * Updates a user.
	 * @param updateUser - The user update data transfer object.
	 * @param _id - The user id from data transfer object.
	 * @param login - The login of the user performing the operation.
	 * @param description - The description of the operation.
	 */
	async updateUser(
		{ _id, ...updateUser }: IUserUpdate,
		login: string,
		description: string = '',
	): Promise<IUser> {
		if (!_id) {
			return this.createUser(updateUser as IUser, login);
		}
		const user = await this.userModel.findOne({
			_id,
			isDeleted: null,
		});
		if (!user) {
			throw new NotFoundException('Нет такого пользователя');
		}
		const newUser = {
			...user.toObject(),
			...updateUser,
			version: user.version + 1,
		};
		if (updateUser.login) {
			await this.checkExist(updateUser.login);
			newUser.loginSlug = makeSlug(updateUser.login);
		}
		if (updateUser.departments) {
			if (!updateUser.departments.includes(newUser.currentDepartment))
				newUser.currentDepartment = updateUser.departments[0];
		}
		if (updateUser.password) {
			newUser.password = await this.hashPassword(updateUser.password);
			newUser.loginToken = '';
			this.usersDBService.removeToken(_id);
		}

		const savedUser = await this.userModel
			.findOneAndUpdate(
				{
					_id,
					isDeleted: null,
				},
				newUser,
				{ new: true },
			)
			.select(DB_IGNORE_FIELDS)
			.lean();

		//если взята работа, то всем сообщать не нужно
		if (
			!(
				Object.keys(updateUser).length == 1 &&
				'currentWorkflowInWork' in updateUser
			)
		) {
			await this.notifyAndLog('edit', savedUser, login, description);
		}
		this.usersDBService.setUser(savedUser);
		return savedUser;
	}

	/**
	 * Deletes a user.
	 * @param id - The ID of the user.
	 * @param login - The login of the user performing the operation.
	 */
	async deleteUser(id: string, login: string): Promise<void> {
		const user = this.findUserByIdAdmin(id);
		if (user) {
			await this.userModel.findByIdAndUpdate(
				id,
				{
					isDeleted: Date.now(),
					login: user.login + '>' + Date.now(),
					loginSlug: user.loginSlug + '>' + Date.now(),
				},
				{ new: true },
			);
			await this.notifyAndLog('delete', user as IUser, login);
			this.usersDBService.deleteUser(id);
		}
	}

	/**
	 * Logs in a user.
	 * @param loginUserDto - The user login data transfer object.
	 */
	async loginUser(loginUserDto: IUserUpdate) {
		const user = await this.userModel.findOne({
			login: loginUserDto.login,
			isDeleted: null,
		});
		if (!user || !(await compare(loginUserDto.password, user.password))) {
			throw new NotFoundException('Нет такого пользователя');
		}
		const salt = await genSalt(13);
		//условие добавлено для того, чтобы можно было войти в систему сразу несколько пользователей с одним логином
		//можно сделать идентификацию компьютера, и на каждый отдельный компьютер сделать свой токен,
		// но в данном проекте такой уровень безопасности не нужен
		if (!user.loginToken) {
			user.loginToken = salt;
		}
		this.usersDBService.setUser({
			_id: user._id.toString(),
			loginToken: user.loginToken,
		});
		await user.save();
		return {
			[user.id]: {
				...this.usersDBService.getById(user.id.toString()),
				loginToken: user.loginToken,
			},
		};
	}

	/**
	 * Gets an authenticated user.
	 * @param _id - The ID of the user.
	 * @param loginToken - The login token of the user.
	 */
	getAuthUser(_id: string, loginToken: string) {
		return {
			[_id]: this.usersDBService.getUserByIdAndToken(_id, loginToken),
		};
	}

	/**
	 * Confirms the user's email.
	 * @param id - The ID of the user.
	 * @param token - The email token.
	 */
	async confirmEmail(id: string, token: string) {
		const result = await this.userModel.findOne({
			_id: id,
			emailToken: token,
		});
		if (result) {
			const user: IUserUpdate = {
				_id: id,
				emailConfirmed: true,
			};
			await this.updateUser(user, id, ' confirm email');
		}
		return result;
	}

	/**
	 * Clears the user's email.
	 * @param id - The ID of the user.
	 */
	async clearEmail(id: string) {
		const result = await this.userModel.findOne({
			_id: id,
		});
		if (result) {
			const user: IUserUpdate = {
				_id: id,
				emailConfirmed: false,
				isSendLetterAboutNewWorks: false,
				emailToken: '',
				email: '',
			};
			await this.updateUser(user, id, ' clear email');
		}
		return result;
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	/**
	 * Checks if a user with the given unique identification exists.
	 * @param uniqIdentification - The unique identification (login or loginSlug).
	 */
	private async checkExist(uniqIdentification: string): Promise<void> {
		const user = await this.userModel.findOne({
			$or: [
				{ loginSlug: makeSlug(uniqIdentification) },
				{ login: uniqIdentification },
			],
		});
		if (user) {
			throw new BadRequestException('Пользователь уже существует');
		}
	}

	/**
	 * Hashes the user's password.
	 * @param password - The password to hash.
	 */
	private async hashPassword(password: string): Promise<string> {
		const salt = await genSalt(13);
		return await hash(password, salt);
	}

	/**
	 * Sends a websocket message and logs the operation.
	 * @param operation - The type of operation ('create' | 'edit' | 'delete').
	 * @param user - The user object.
	 * @param login - The login of the user performing the operation.
	 * @param description - The description of the operation.
	 */
	private async notifyAndLog(
		operation: 'create' | 'edit' | 'delete',
		user: IUser,
		login: string,
		description: string = '',
	): Promise<void> {
		const websocketOperation: Record<
			'create' | 'edit' | 'delete',
			'delete' | 'update'
		> = {
			create: 'update',
			edit: 'update',
			delete: 'delete',
		};
		await this.websocket.sendMessage({
			bd: 'users',
			operation: websocketOperation[operation],
			id: user._id.toString(),
			version: user.version,
		});
		await this.logService.saveToLog({
			bd: 'user',
			date: Date.now(),
			description: description,
			operation,
			idWorker: login,
			idSubject: user._id.toString(),
		});
	}
}
