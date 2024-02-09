import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IWebsocket } from '@/dto-schemas-interfaces/websocket.interface';
import { UsersDBService } from '@/BD/usersDB.service';

@WebSocketGateway(3333)
export class WebsocketService
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	constructor(private usersDBService: UsersDBService) {}

	async handleConnection(client: Socket): Promise<void> {
		console.log(`Client connected: ${client.id}`);
		const login = client.handshake.query.login as string;
		const token = client.handshake.query.loginToken as string;

		console.log('Login: ', login);
		console.log('loginToken: ', token);

		if (!(await this.usersDBService.findUser(login, token))) {
			client.disconnect();
		} else {
			await this.sendMessage({
				bd: 'websocket',
				operation: 'update',
				id: JSON.stringify(await this.getConnectedClients()),
				version: 0,
			});
		}
	}

	async handleDisconnect(client: Socket): Promise<void> {
		console.log(`Client disconnected: ${client.id}`);
		await this.sendMessageToAnywhere({
			bd: 'websocket',
			operation: 'update',
			id: JSON.stringify(await this.getConnectedClients()),
			version: 0,
		});
		console.log('клиенты: ', await this.getConnectedClients());
	}

	async sendMessage(message: IWebsocket) {
		if (message.bd === 'flash' || message.bd === 'invite') {
			await this.sendMessageToUser(message);
		} else {
			await this.sendMessageToAnywhere(message);
		}
	}

	async sendMessageToUser(message: IWebsocket) {
		const client = [...this.server.sockets.sockets.values()].find(
			(socket) => socket.handshake.query.login === message.id,
		);
		if (client) {
			client.emit('servermessage', message);
		}
	}

	private async sendMessageToAnywhere(message: IWebsocket) {
		this.server.emit('servermessage', message); //отправка всем
	}

	private async getConnectedClients() {
		return [...this.server.sockets.sockets.values()].map(
			(socket) => socket.handshake.query.login,
		);
	}
}
