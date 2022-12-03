import { unsealData } from "iron-session";
import Filter from "bad-words";
import ws from "ws";

import dotenv from "dotenv";
import { v4 } from "uuid";
import { DiscouseUserFlags, hasFlag } from "./DiscourseUserFlags";
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

	// [Client -> Server] Send to the server when initializing a admin connection
	ADMIN_INIT,

	REQUEST_USER_STATE,

	GLOBAL_STATE_CHANGED,

	CHANGE_GLOBAL_STATE,
	CHANGE_GLOBAL_STATE_ACK
}

enum ConnectionType {
	CHAT,
	ADMIN,
}

declare module "ws" {
	export interface WebSocket extends ws {
		id: string;
		missedPings: number;
		type: ConnectionType;
		isAdmin: boolean;
		isMuted: boolean;
	}
}

const clients: Record<string, ws.WebSocket> = {};
const states: Record<string, any> = {};
const wss = new ws.WebSocketServer({ port: 3001 });
const globalState = {
	muted: false,
	chatDisabled: false
}

// Broadcast a message to every connected client
const broadcast = (data: any, blacklist?: string[]) => {
	wss.clients.forEach((client) => {
		if (blacklist?.includes(client.id)) {
			return;
		}

		if (client.type !== ConnectionType.CHAT) {
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

	const { id, username, flags } = sessionData.user as any;
	if (id == null || username == null) {
		localSocket.close();
		return;
	}

	localSocket.id = id;
	localSocket.missedPings = 0;
	localSocket.isAdmin = hasFlag(flags as number, DiscouseUserFlags.Admin);
	localSocket.isMuted = hasFlag(flags as number, DiscouseUserFlags.GlobalMuted);
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

			case PackageType.CHANGE_GLOBAL_STATE: {
				if (!localSocket.isAdmin) return;

				if (!(json.key in globalState)) {
					localSocket.send(JSON.stringify({
						type: PackageType.CHANGE_GLOBAL_STATE_ACK,
						state: globalState,
						success: false
					}));
					return;
				}

				(globalState as any)[json.key] = json.value;
				broadcast({
					type: PackageType.GLOBAL_STATE_CHANGED,
					state: globalState
				});
				localSocket.send(JSON.stringify({
					type: PackageType.CHANGE_GLOBAL_STATE_ACK,
					state: globalState,
					success: true
				}));
			} break;

			case PackageType.STATE_CHANGE: {
				if (localSocket.isMuted) {
					json.state.muted = true;
				}

				if (globalState.muted) {
					json.state.muted = localSocket.isAdmin ? json.state.muted : true;
				}

				states[localSocket.id] = json.state;
				broadcast({
					type: PackageType.STATE_CHANGE,
					uid: localSocket.id,
					state: json.state
				}, [localSocket.id]);
			} break;

			case PackageType.ADMIN_INIT: {
				if (!localSocket.isAdmin) {
					localSocket.close();
					return;
				}

				// Send them the current global state
				localSocket.type = ConnectionType.ADMIN;
				localSocket.send(JSON.stringify({
					type: PackageType.ADMIN_INIT,
					state: globalState
				}))
			} break;

			case PackageType.REQUEST_USER_STATE: {
				const uid = json.uid;
				if (uid == null || !(uid in clients)) {
					return;
				}

				localSocket.send(JSON.stringify({
					type: PackageType.STATE_CHANGE,
					uid,
					state: states[uid]
				}));
			} break;

			case PackageType.INIT: {
				localSocket.type = ConnectionType.CHAT;
				broadcast({
					type: PackageType.CLIENT_JOINED,
					uid: localSocket.id
				}, [localSocket.id]);
				localSocket.send(JSON.stringify({
					type: PackageType.GLOBAL_STATE_CHANGED,
					state: globalState
				}));
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
				if (!localSocket.isAdmin) return;

				chatHistory = chatHistory.filter((chat) => chat.id !== json.id);
				broadcast({
					type: PackageType.DELETE_CHAT,
					id: json.id
				});
			} break;

			case PackageType.CLEAR_CHAT: {
				if (!localSocket.isAdmin) return;

				chatHistory = [];
				broadcast({
					type: PackageType.CLEAR_CHAT
				});
			} break;

			case PackageType.SEND_CHAT: {
				console.log(localSocket.isAdmin);
				if (localSocket.id == null || (globalState.chatDisabled && !localSocket.isAdmin)) {
					console.log(0);
					return;
				}

				// Ensure the message is not undefined and has at least 1 character
				if (json.message == undefined || json.message == "" || typeof json.message != "string" || json.message.trim().length <= 0 || json.message.length > 250) {
					console.log(2);
					return;
				}

				// If it has been 1 hour since the last message, clear the history
				if (Date.now() - lastChat > 1 * 60 * 60 * 1000) {
					chatHistory = [];
				}

				// If the user has sent a second message within the last 1.5 seconds, ignore it
				if (Date.now() - lastChats[localSocket.id] < 1500) {
					console.log(3);
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
		delete states[localSocket.id];
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