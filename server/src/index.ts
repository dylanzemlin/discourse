import Filter from "bad-words";
import { Server } from "http";
import { v4 } from "uuid";
import ws from "ws";

const filter = new Filter();
let chatHistory: {
	socket_id: string;
	message: string;
}[] = [];
let lastChat = Date.now();
let lastChats: Record<string, number> = {};

declare module "ws" {
	export interface WebSocket extends ws {
		id: string;
	}
}

enum PackageType {
	CONNECT,
	SEND_CHAT,

	SIGNAL,
	CLIENT_JOINED,
	CLIENT_JOINED_ACK,
	CLIENT_DISCONNECTED
}

const clients: Record<string, ws.WebSocket> = {};
const wss = new ws.WebSocketServer({ port: 3001 });

// Broadcast a message to every connected client
const broadcast = (data: any, blacklist?: string[]) => {
	wss.clients.forEach((client) => {
		if (blacklist?.includes(client.id)) {
			return;
		}

		if (client.readyState === ws.OPEN) {
			client.send(JSON.stringify(data));
		}
	});
}

wss.on("connection", (localSocket, req) => {
	// Generate a unique id for each connection!
	localSocket.on("message", (data) => {
		const json = JSON.parse(data.toString());
		switch (json.type) {
			case PackageType.CONNECT: {
				const id = localSocket.id = json.uid;
				if (id == null) {
					localSocket.close();
					return;
				}

				console.log(`Client ${localSocket.id} connected!`);

				clients[id] = localSocket;

				broadcast({
					type: PackageType.CLIENT_JOINED,
					uid: localSocket.id
				}, [localSocket.id]);
			} break;

			case PackageType.SIGNAL: {
				const peer = clients[json.uid];
				if (peer == null) {
					return;
				}

				peer.send(JSON.stringify({
					type: PackageType.SIGNAL,
					uid: localSocket.id,
					signal: json.signal
				}));
			} break;

			case PackageType.CLIENT_JOINED_ACK: {
				const peer = clients[json.uid];
				if (peer == null) {
					return;
				}

				peer.send(JSON.stringify({
					type: PackageType.CLIENT_JOINED_ACK,
					uid: localSocket.id
				}));
			} break;

			case PackageType.SEND_CHAT: {
				if (localSocket.id == null) {
					return;
				}

				// Ensure the message is not undefined and has at least 1 character
				if (json.message == undefined || json.message == "" || typeof json.message != "string" || json.message.trim().length <= 0) {
					return;
				}

				// If it has been 1 hour since the last message, clear the history
				if (Date.now() - lastChat > 1 * 60 * 60 * 1000) {
					chatHistory = [];
				}

				// If the user has sent a second message within the last 1.5 seconds, ignore it
				if (Date.now() - lastChats[localSocket.id] < 1500) {
					return;
				}
				lastChats[localSocket.id] = Date.now();

				// Clean the message and push it to the history
				const message = filter.clean(json.message);
				chatHistory.push({
					socket_id: localSocket.id,
					message
				});

				// Ensure the history has at most 50 messages
				if (chatHistory.length > 50) {
					chatHistory.shift();
				}

				// Send the cleaned message to all clients
				broadcast({
					type: PackageType.SEND_CHAT,
					message: message,
					socket_id: localSocket.id,
					name: json.name
				});
			} break;
		}
	});

	localSocket.on("close", () => {
		delete clients[localSocket.id];
		broadcast({
			type: PackageType.CLIENT_DISCONNECTED,
			socket_id: localSocket.id
		});
	});

	// if they do not send CONNECT within 5 seconds, disconnect them
	setTimeout(() => {
		if (localSocket.id == null) {
			localSocket.close();
		}
	}, 5000);
});

wss.on("listening", () => {
	console.log("Server started!");
})