import { Injectable } from '@nestjs/common';
import {
	IEmailRecipient,
	IUser,
	IUserUpdate,
} from '@/dto-schemas-interfaces/user.dto.schema';
import { FIELDS_TO_DELETE } from '@/consts/db';

export interface IUsersDB {
	[key: string]: IUserUpdate;
}

@Injectable()
export class UsersDBService {
	private _tokens: { [key: string]: string };

	constructor() {
		this._users = {};
		this._tokens = {};
	}

	private _users: IUsersDB;

	get users(): IUsersDB {
		return this._users;
	}

	set users(usersArray: IUser[]) {
		for (const user of usersArray) {
			if ('loginToken' in user) {
				if (user.loginToken)
					this._tokens[user._id.toString()] = user.loginToken;
				delete user.loginToken;
			}
			this._users[user._id.toString()] = user;
		}
	}

	get usersShort(): IUsersDB {
		const users: IUsersDB = {};
		Object.values(this._users).map((user) => {
			users[user._id.toString()] = {
				_id: user._id,
				name: user.name,
				departments: user.departments,
				version: user.version,
			};
		});
		return users;
	}

	removeToken(id: string): void {
		delete this._tokens[id];
	}

	getById(id: string): IUserUpdate {
		return this._users[id];
	}

	getByIdShort(id: string): IUserUpdate {
		return this._users[id]
			? {
					name: this._users[id].name,
					departments: this._users[id].departments,
					_id: this._users[id]._id,
					version: this._users[id].version,
				}
			: null;
	}

	setUser(user: IUserUpdate) {
		let oldUser: IUserUpdate = {};
		if (user._id) {
			if (this._users[user._id.toString()]) {
				oldUser = JSON.parse(
					JSON.stringify(this._users[user._id.toString()]),
				);
			}
			if (user.loginToken) {
				this._tokens[user._id.toString()] = user.loginToken;
				delete user.loginToken;
			}
			FIELDS_TO_DELETE.forEach((property) => {
				if (user[property]) {
					delete user[property];
				}
			});
			this._users[user._id.toString()] = {
				...oldUser,
				...user,
			};
		}
	}

	getName(id: string) {
		return this._users[id].name;
	}

	deleteUser(id: string) {
		delete this._users[id];
	}

	getUserByIdAndToken(_id: string, loginToken: string) {
		return this._users[_id] && this._tokens[_id] === loginToken
			? this._users[_id]
			: null;
	}

	getEmailRecipients(currentDepartment: string): IEmailRecipient[] {
		const recipients: IEmailRecipient[] = [];
		for (const user of Object.values(this._users)) {
			if (
				user.departments.includes(currentDepartment) &&
				user.isSendLetterAboutNewWorks
			) {
				recipients.push({
					name: user.name,
					email: user.email,
				});
			}
		}
		return recipients.length > 0 ? recipients : null;
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               AUTHENTICATION METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	async findUser(_id: string, loginToken: string) {
		return (
			this.users[_id] &&
			this._tokens[_id] &&
			loginToken &&
			this._tokens[_id] === loginToken
		);
	}

	async findAdmin(_id: string, loginToken: string) {
		return (
			this._users[_id] &&
			this._tokens[_id] &&
			loginToken &&
			this._tokens[_id] === loginToken &&
			this._users[_id].isAdmin === true
		);
	}

	async findCanModification(_id: string, loginToken: string) {
		return (
			this._users[_id] &&
			this._tokens[_id] &&
			loginToken &&
			this._tokens[_id] === loginToken &&
			(this._users[_id].canMakeModification === true ||
				this._users[_id].isAdmin === true)
		);
	}

	async findStartStop(_id: string, loginToken: string) {
		return (
			this._users[_id] &&
			this._tokens[_id] &&
			loginToken &&
			this._tokens[_id] === loginToken &&
			(this._users[_id].canStartStopWorks === true ||
				this._users[_id].isAdmin === true)
		);
	}

	async findCanSeeStatistic(_id: string, loginToken: string) {
		return (
			this._users[_id] &&
			this._tokens[_id] &&
			loginToken &&
			this._tokens[_id] === loginToken &&
			(this._users[_id].canSeeStatistics === true ||
				this._users[_id].isAdmin === true)
		);
	}
}
