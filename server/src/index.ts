import { unsealData } from "iron-session";
import Filter from "bad-words";
import ws from "ws";

import dotenv from "dotenv";
import { v4 } from "uuid";
dotenv.config();

const filter = new Filter();
let chatHistory: {
	uid: string;
	content: string;
	author: string;
	color: string;
	id: string;
	time: string;
}[] = [];
let lastChat = Date.now();
let lastChats: Record<string, number> = {};

export enum PackageType {
  // [Server -> Client] Used to request a ping from a client
  // [Client -> Server] Used to respond to a ping from the server
  PING,

  // [Server -> Client] Used to broadcast a new chat message to all clients
  // [Client -> Server] Used to send a new chat message to the server
  SEND_CHAT,

  // [Server -> Client] Used to broadcast that a message should be deleted
  // [Client -> Server] Tells the server to delete a chat message
	DELETE_CHAT,

	// [Server -> Client] Used to broadcast that the chat history should be cleared
  // [Client -> Server] Tells the server to delete the chat history
	CLEAR_CHAT,
  
  // [Client -> Server] Send to the server 
  INIT,

  // [Client -> Server] Send a signal to another peer
  // [Server -> Client] Send a signal to a peer
  SIGNAL,

  // [Server -> Client] Send to a client when a new client joins
  CLIENT_JOINED,

  // [Client -> Server] Send to the server when a client joins and is acknowledged by a peer
  CLIENT_JOINED_ACK,

  // [Server -> Client] Send to a client when a client disconnects
  CLIENT_DISCONNECTED,

  // [Server -> Client] Broadcast to all clients when a client changes their state (muted, video, etc)
  // [Client -> Server] Send to the server when the state changes (muted, video, etc)
  STATE_CHANGE,
}

declare module "ws" {
	export interface WebSocket extends ws {
		id: string;
		missedPings: number;
	}
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

wss.on("connection", async (localSocket, req) => {
	const cookies = req.headers.cookie?.split("; ").reduce((acc, cookie) => {
		const [key, value] = cookie.split("=");
		acc[key] = value;
		return acc;
	}, {} as Record<string, string>);

	if (cookies?.["discourse-session"] == null) {
		localSocket.close();
		return;
	}

	const sessionCookie = cookies["discourse-session"];
	const sessionData = await unsealData(sessionCookie, {
		password: process.env.IRON_PASSWORD as string
	});

	const { id, username } = sessionData.user as any;
	if (id == null || username == null) {
		localSocket.close();
		return;
	}

	localSocket.id = id;
	localSocket.missedPings = 0;
	localSocket.send(JSON.stringify({
		type: PackageType.INIT,
		chatHistory
	}));
	clients[localSocket.id] = localSocket;

	const pingInterval = setInterval(() => {
		if (localSocket.missedPings >= 2) {
			localSocket.close();
			return;
		}

		localSocket.missedPings++;
		localSocket.send(JSON.stringify({
			type: PackageType.PING
		}));
	}, 5000);

	// Generate a unique id for each connection!
	localSocket.on("message", (data) => {
		const json = JSON.parse(data.toString());
		switch (json.type) {
			case PackageType.PING: {
				localSocket.missedPings = 0;
			} break;

			case PackageType.STATE_CHANGE: {
				broadcast({
					type: PackageType.STATE_CHANGE,
					uid: localSocket.id,
					state: json.state
				}, [localSocket.id]);
			} break;
			
			case PackageType.INIT: {
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

			case PackageType.DELETE_CHAT: {
				// Technically we should do some server side authentication here, but it'll be okay
				chatHistory = chatHistory.filter((chat) => chat.id !== json.id);
				broadcast({
					type: PackageType.DELETE_CHAT,
					id: json.id
				});
			} break;

			case PackageType.CLEAR_CHAT: {
				// Technically we should do some server side authentication here, but it'll be okay
				chatHistory = [];
				broadcast({
					type: PackageType.CLEAR_CHAT
				});
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
				const id = v4();
				chatHistory.push({
					uid: localSocket.id,
					content: message,
					color: json.color,
					author: json.name,
					id,
					time: new Date().toLocaleTimeString()
				});

				// Ensure the history has at most 50 messages
				if (chatHistory.length > 50) {
					chatHistory.shift();
				}

				// Send the cleaned message to all clients
				broadcast({
					type: PackageType.SEND_CHAT,
					content: message,
					uid: localSocket.id,
					author: json.name,
					color: json.color,
					id,
					time: new Date().toLocaleTimeString()
				});
			} break;
		}
	});

	localSocket.on("close", () => {
		broadcast({
			type: PackageType.CLIENT_DISCONNECTED,
			uid: localSocket.id
		});
		delete clients[localSocket.id];
		clearInterval(pingInterval);
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