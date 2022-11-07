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
		uid: string;
	}
}

const clients: Record<string, ws.WebSocket> = {};
const createSocket = (server: Server) => {
	const wss = new ws.WebSocketServer({
		noServer: true,
		path: "/socket"
	});

	// Manually handle upgrade request
	server.on("upgrade", (req, socket, head) => {
		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit("connection", ws, req);
		});
	});

	// Broadcast a message to every connected client
	const broadcast = (data: any) => {
		wss.clients.forEach((client) => {
			if (client.readyState === ws.OPEN) {
				client.send(JSON.stringify(data));
			}
		});
	}

	wss.on("connection", (localSocket, req) => {
		// Generate a unique id for each connection!
		localSocket.uid = v4();
		clients[localSocket.uid] = localSocket;

		localSocket.on("message", (data: string) => {
			const json = JSON.parse(data);
			switch (json.id) {
				case "signal": {
					clients[json.socket_id]?.send({
						id: "signal",
						socket_id: json.socket_id,
						signal: json.signal
					})
				} break;

				case "client_connected_ack": {
					clients[json.socket_id]?.send({
						id: "client_connected_ack",
						socket_id: localSocket.uid
					});
				} break;

				case "chat_message": {
					// Ensure the message is not undefined and has at least 1 character
					if (json.message == undefined || json.message == "" || typeof json.message != "string" || json.message.trim().length <= 0) {
						return;
					}

					// If it has been 1 hour since the last message, clear the history
					if (Date.now() - lastChat > 1 * 60 * 60 * 1000) {
						chatHistory = [];
					}

					// If the user has sent a second message within the last 1.5 seconds, ignore it
					if (Date.now() - lastChats[localSocket.uid] < 1500) {
						return;
					}
					lastChats[localSocket.uid] = Date.now();

					// Clean the message and push it to the history
					const message = filter.clean(json.message);
					chatHistory.push({
						socket_id: localSocket.uid,
						message
					});

					// Ensure the history has at most 50 messages
					if (chatHistory.length > 50) {
						chatHistory.shift();
					}

					// Send the cleaned message to all clients
					broadcast({
						id: "chat_message",
						message: message,
						socket_id: localSocket.uid,
						name: json.name
					});
				} break;
			}
		});

		localSocket.on("close", () => {
			delete clients[localSocket.uid];
			broadcast({
				id: "client_disconnected",
				socket_id: localSocket.uid
			});
		});

		broadcast({
			id: "client_connected",
			uid: localSocket.uid
		});

		chatHistory.forEach((message) => {
			localSocket.send(JSON.stringify({
				id: "chat_message",
				message: message.message,
				socket_id: message.socket_id
			}));
		});
	});

	return wss;
}

export default createSocket;