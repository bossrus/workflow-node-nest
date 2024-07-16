import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IEmailRecipient } from '@/dto-schemas-interfaces/user.dto.schema';
import { IMailListByDepartments } from '@/dto-schemas-interfaces/forMail';
import { UsersDBService } from '@/BD/usersDB.service';
import { DepartmentsDBService } from '@/BD/departmentsDB.service';
import { ModificationsDBService } from '@/BD/modificationsDB.service';
import { FirmsDBService } from '@/BD/firmsDB.service';

@Injectable()
export class MailService {
	constructor(
		private readonly mailerService: MailerService,
		private userDBService: UsersDBService,
		private departmentsDBService: DepartmentsDBService,
		private modificationsDBService: ModificationsDBService,
		private firmDBService: FirmsDBService,
	) {}

	/**
	 * Sends an email confirmation to the user.
	 * @param email - The recipient's email address.
	 * @param username - The recipient's username.
	 * @param url - The confirmation URL.
	 */
	async sendEmailConfirmation(email: string, username: string, url: string) {
		await this.mailerService.sendMail({
			to: email,
			subject: 'Подтверждение доставки писем',
			template: 'confirmation',
			context: {
				username,
				url,
			},
		});
	}

	/**
	 * Sends an email notification about a new order to the department.
	 * @param departmentId - The ID of the department.
	 * @param title - The title of the order.
	 * @param firmId - The ID of the firm.
	 * @param modificationId - The ID of the modification.
	 * @param countPictures - The number of pictures.
	 */
	async sendEmailNotification(
		departmentId: string,
		title: string,
		firmId: string,
		modificationId: string,
		countPictures: number,
	) {
		const recipients = this.userDBService.getEmailRecipients(departmentId);
		if (recipients) {
			const firm = this.firmDBService.getTitle(firmId);
			const modification =
				this.modificationsDBService.getTitle(modificationId);
			for (const recipient of recipients) {
				await this.mailerService.sendMail({
					to: recipient.email,
					subject: 'В отдел поступил заказ',
					template: 'notification',
					context: {
						name: recipient.name,
						title,
						firm,
						modification,
						countPictures,
					},
				});
			}
		}
	}

	/**
	 * Sends email notifications about new materials to multiple departments.
	 * @param mailListByDepartments - The list of departments and their respective materials.
	 */
	async sendEmailNotificationPublish(
		mailListByDepartments: IMailListByDepartments,
	) {
		for (const departmentTitle in mailListByDepartments) {
			const recipients: IEmailRecipient[] =
				this.userDBService.getEmailRecipients(
					mailListByDepartments[departmentTitle].departmentId,
				);
			if (recipients) {
				let letter: string =
					'В работу поступили следующие материалы:\n';
				let count: number = 0;
				for (const modificationAndFirm in mailListByDepartments[
					departmentTitle
				].mailList) {
					const mailItem =
						mailListByDepartments[departmentTitle].mailList[
							modificationAndFirm
						];
					letter += `В ${mailItem.firmTitle} (№ ${mailItem.modificationTitle}):\n`;
					count += mailItem.titles.length;
					letter += mailItem.titles.join('\n');
				}
				for (const recipient of recipients) {
					await this.mailerService.sendMail({
						to: recipient.email,
						subject: `Новых заказов в отделе — ${count}`,
						template: 'notificationPublish',
						context: {
							name: recipient.name,
							letter,
						},
					});
				}
			}
		}
	}
}
