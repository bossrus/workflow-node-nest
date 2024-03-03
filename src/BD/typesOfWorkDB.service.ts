import { Injectable } from '@nestjs/common';
import {
	ITypeOfWork,
	ITypeOfWorkUpdate,
} from '@/dto-schemas-interfaces/typeOfWork.dto.schema';
import makeSlug from '@/services/makeSlug';
import { FIELDS_TO_DELETE } from '@/consts/db';

export interface ITypesOfWorkDB {
	[key: string]: ITypeOfWork;
}

@Injectable()
export class TypesOfWorkDBService {
	private _typesOfWork: ITypesOfWorkDB = {};

	get typesOfWork(): ITypesOfWorkDB {
		return this._typesOfWork;
	}

	set typesOfWork(typesOfWork: ITypeOfWork[]) {
		this._typesOfWork = {};
		typesOfWork.forEach((typeOfWork) => {
			this._typesOfWork[typeOfWork._id] = typeOfWork;
		});
	}

	setTypeOfWork(typeOfWork: ITypeOfWork) {
		FIELDS_TO_DELETE.forEach((property) => {
			if (typeOfWork[property]) {
				delete typeOfWork[property];
			}
		});
		this._typesOfWork[typeOfWork._id] = typeOfWork;
	}

	getById(id: string): ITypeOfWork {
		return this._typesOfWork[id];
	}

	delete(id: string) {
		return delete this._typesOfWork[id];
	}

	updateTypeOfWork(newTypeOfWork: ITypeOfWorkUpdate) {
		this._typesOfWork[newTypeOfWork._id] = {
			...this._typesOfWork[newTypeOfWork._id],
			...newTypeOfWork,
		};
	}

	findByTitle(title: string) {
		const titleSlug = makeSlug(title);
		return Object.values(this.typesOfWork).find(
			(dept) => dept.title === title || dept.titleSlug === titleSlug,
		);
	}

	getTitle(id: string) {
		return this.typesOfWork[id].title;
	}

	deleteTypeOfWork(id: string) {
		delete this._typesOfWork[id];
	}
}
