import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { compare, genSalt, hash } from 'bcrypt';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { IUser, IUserUpdate } from '@/dto-schemas-interfaces/user.dto.schema';
import { UsersDBService, IUsersDB } from '@/BD/usersDB.service';
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

	async onModuleInit() {
		console.log('\n   \tзагружаю usersDB\n');
		this.usersDBService.users = await this.loadUsersFromBase();
	}

	async loadUsersFromBase() {
		return this.userModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	async createUser(createUserDto: IUser, login: string): Promise<IUser> {
		console.log(createUserDto.login, '\nсоздаю пользователя\n');
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
		await this.websocket.sendMessage({
			bd: 'user',
			operation: 'update',
			id: newUser._id.toString(),
			version: newUser.version,
		});
		this.usersDBService.setUser(newUser.toObject());
		await this.logService.saveToLog({
			bd: 'user',
			date: Date.now(),
			description: '',
			operation: 'create',
			idWorker: login,
			idSubject: newUser._id.toString(),
		});
		return newUser;
	}

	findAllUsersAdmin(): IUsersDB {
		return this.usersDBService.users;
	}

	findAllUsers(): IUserUpdate[] {
		return this.usersDBService.usersShort;
	}

	findUserByIdAdmin(id: string) {
		return this.usersDBService.getById(id);
	}

	findUserById(id: string, login: string) {
		//если запрашиваешь сам себя, то получи полную информацию
		if (login === id) {
			console.log('запросил сам себя');
			return this.findUserByIdAdmin(id);
		}
		return this.usersDBService.getByIdShort(id);
	}

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
		}
		return false;
	}

	async updateUser(
		{ _id, ...updateUser }: IUserUpdate,
		login: string,
		description: string = '',
	): Promise<IUser> {
		if (!_id) {
			throw new BadRequestException('User _id is required');
		}
		const user = await this.userModel.findOne({
			_id,
			isDeleted: null,
		});
		if (!user) {
			throw new NotFoundException('User not found');
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
			await this.websocket.sendMessage({
				bd: 'user',
				operation: 'update',
				id: savedUser._id.toString(),
				version: savedUser.version,
			});
			await this.logService.saveToLog({
				bd: 'user',
				date: Date.now(),
				description: description,
				operation: 'edit',
				idWorker: login,
				idSubject: savedUser._id.toString(),
			});
		}
		this.usersDBService.setUser(savedUser);
		return savedUser;
	}

	async deleteUser(id: string, login: string): Promise<void> {
		const user = this.findUserByIdAdmin(id);
		if (user) {
			this.userModel.findByIdAndUpdate(id, { isDeleted: Date.now() });
			await this.websocket.sendMessage({
				bd: 'user',
				operation: 'delete',
				id: user._id.toString(),
				version: user.version,
			});
			this.usersDBService.deleteUser(id);
			await this.logService.saveToLog({
				bd: 'user',
				date: Date.now(),
				description: '',
				operation: 'delete',
				idWorker: login,
				idSubject: user._id.toString(),
			});
		}
	}

	async loginUser(loginUserDto: IUserUpdate) {
		const user = await this.userModel.findOne({
			login: loginUserDto.login,
			isDeleted: null,
		});
		if (!user || !(await compare(loginUserDto.password, user.password))) {
			throw new UnauthorizedException('User not found');
		}
		const salt = await genSalt(13);
		user.loginToken = salt;
		this.usersDBService.setUser({
			_id: user._id.toString(),
			loginToken: salt,
		});
		return user.save();
	}

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

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	private async checkExist(uniqIdentification: string): Promise<void> {
		const user = await this.userModel.findOne({
			$or: [
				{ loginSlug: makeSlug(uniqIdentification) },
				{ login: uniqIdentification },
			],
		});
		if (user) {
			throw new BadRequestException('User already exists');
		}
	}

	private async hashPassword(password: string): Promise<string> {
		const salt = await genSalt(13);
		return await hash(password, salt);
	}
}
