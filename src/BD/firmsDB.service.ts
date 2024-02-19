import { Injectable } from '@nestjs/common';
import { IFirm, IFirmUpdate } from '@/dto-schemas-interfaces/firm.dto.schema';
import makeSlug from '@/services/makeSlug';
import { FIELDS_TO_DELETE } from '@/consts/db';

export interface IFirmsDB {
	[key: string]: IFirm;
}

@Injectable()
export class FirmsDBService {
	private _firms: IFirmsDB = {};

	get firms(): IFirmsDB {
		return this._firms;
	}

	set firms(firms: IFirm[]) {
		this._firms = {};
		firms.forEach((firm) => {
			this._firms[firm._id] = firm;
		});
	}

	setFirm(firm: IFirm) {
		FIELDS_TO_DELETE.forEach((property) => {
			if (firm[property]) {
				delete firm[property];
			}
		});
		this._firms[firm._id] = firm;
	}

	getById(id: string): IFirm {
		return this._firms[id];
	}

	delete(id: string) {
		return delete this._firms[id];
	}

	updateFirm(newFirm: IFirmUpdate) {
		this._firms[newFirm._id] = {
			...this._firms[newFirm._id],
			...newFirm,
		};
	}

	findByTitle(title: string) {
		const titleSlug = makeSlug(title);
		return Object.values(this.firms).find(
			(dept) => dept.title === title || dept.titleSlug === titleSlug,
		);
	}

	deleteFirm(id: string) {
		delete this._firms[id];
	}

	getTitle(firmId: string) {
		return this._firms[firmId].title;
	}
}
