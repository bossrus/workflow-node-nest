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

	async sendEmailConfirmation(email: string, username: string, url: string) {
		console.log('отправка письма');
		await this.mailerService.sendMail({
			to: email, // list of receivers
			subject: 'Подтверждение доставки писем', // Subject line
			template: 'confirmation', // The `.hbs` template to use
			context: {
				// Data to be sent to template engine.
				username,
				url,
			},
		});
	}

	async sendEmailNotification(
		departmentId: string,
		title: string,
		firmId: string,
		modificationId: string,
		countPictures: number,
	) {
		const recipients = this.userDBService.getEmailRecipients(departmentId);
		if (recipients) {
			console.log('отправка писем');
			const firm = this.firmDBService.getTitle(firmId);
			const modification =
				this.modificationsDBService.getTitle(modificationId);
			for (const recipient of recipients) {
				await this.mailerService.sendMail({
					to: recipient.email, // list of receivers
					subject: 'В отдел поступил заказ', // Subject line
					template: 'notification', // The `.hbs` template to use
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

	async sendEmailNotificationPublish(
		mailListByDepartments: IMailListByDepartments,
	) {
		console.log('отправка писем publish');
		console.log('mailListByDepartments = ', mailListByDepartments);
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
					letter += `В ${mailListByDepartments[departmentTitle].mailList[modificationAndFirm].firmTitle} (№ ${mailListByDepartments[departmentTitle].mailList[modificationAndFirm].modificationTitle}):\n`;
					console.log(
						'проверяем mailListByDepartments[departmentTitle] = ',
						mailListByDepartments[departmentTitle],
					);
					console.log('modificationAndFirm = ', modificationAndFirm);
					console.log(
						'\tитого ',
						mailListByDepartments[departmentTitle].mailList[
							modificationAndFirm
						],
					);
					count +=
						mailListByDepartments[departmentTitle].mailList[
							modificationAndFirm
						].titles.length;
					letter +=
						mailListByDepartments[departmentTitle].mailList[
							modificationAndFirm
						].titles.join('\n');
				}
				for (const recipient of recipients) {
					await this.mailerService.sendMail({
						to: recipient.email,
						subject: `Новых заказов в отделе — ${count}`, // Subject line
						template: 'notificationPublish', // The `.hbs` template to use
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
