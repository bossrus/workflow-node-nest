import { Injectable } from '@nestjs/common';
import {
	IWorktype,
	IWorktypeUpdate,
} from '@/dto-schemas-interfaces/worktype.dto.schema';
import makeSlug from '@/services/makeSlug';
import { FIELDS_TO_DELETE } from '@/consts/db';

export interface IWorktypesDB {
	[key: string]: IWorktype;
}

@Injectable()
export class WorktypesDBService {
	private _worktypes: IWorktypesDB = {};

	get worktypes(): IWorktype[] {
		return Object.values(this._worktypes);
	}

	set worktypes(worktypes: IWorktype[]) {
		this._worktypes = {};
		worktypes.forEach((worktype) => {
			this._worktypes[worktype._id] = worktype;
		});
	}

	setWorktype(worktype: IWorktype) {
		FIELDS_TO_DELETE.forEach((property) => {
			if (worktype[property]) {
				delete worktype[property];
			}
		});
		this._worktypes[worktype._id] = worktype;
	}

	getById(id: string): IWorktype {
		return this._worktypes[id];
	}

	delete(id: string) {
		return delete this._worktypes[id];
	}

	updateWorktype(newWorktype: IWorktypeUpdate) {
		this._worktypes[newWorktype._id] = {
			...this._worktypes[newWorktype._id],
			...newWorktype,
		};
	}

	findByTitle(title: string) {
		const titleSlug = makeSlug(title);
		return Object.values(this.worktypes).find(
			(dept) => dept.title === title || dept.titleSlug === titleSlug,
		);
	}

	getTitle(id: string) {
		return this.worktypes[id].title;
	}

	deleteWorktype(id: string) {
		delete this._worktypes[id];
	}
}
