import { Injectable } from '@nestjs/common';
import { IModification } from '@/dto-schemas-interfaces/modification.dto.schema';
import { FIELDS_TO_DELETE } from '@/consts/db';

export interface IModificationsDB {
	[key: string]: IModification;
}

@Injectable()
export class ModificationsDBService {
	private _modifications: IModificationsDB = {};

	get modifications(): IModificationsDB {
		return this._modifications;
	}

	set modifications(modifications: IModification[]) {
		this._modifications = {};
		modifications.forEach((modification) => {
			this._modifications[modification._id] = modification;
		});
	}

	setModification(modification: IModification) {
		FIELDS_TO_DELETE.forEach((property) => {
			if (modification[property]) {
				delete modification[property];
			}
		});
		this._modifications[modification._id] = modification;
	}

	getById(id: string): IModification {
		return this._modifications[id];
	}

	getTitle(id: string): string {
		return this.modifications[id].title;
	}

	deleteModification(id: string) {
		delete this._modifications[id];
	}
}
