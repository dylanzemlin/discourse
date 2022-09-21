import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { ironSession } from "iron-session/express";
import { Server } from "socket.io";
import { createServer } from "http";

declare module "iron-session" {
	interface IronSessionData {
		user?: {
			id: number;
		};
	}
}

const app = express();
const session = ironSession({
	cookieName: "discourse_session",
	password: process.env.IRON_SECRET as string
});

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.static(path.join(__dirname, "../", "public")));

app.get("/", session, (req, res) => {
	// if (req.session.user?.id == null) {
	// 	return res.redirect("/login");
	// }

	res.render("index");
});

app.get("/login", session, (req, res) => {
	// if (req.session.user?.id != null) {
	// 	return res.redirect("/");
	// }

	res.render("login");
});

app.get("/core", session, (req, res) => {
	// if (req.session.user?.id != null) {
	// 	return res.redirect("/");
	// }

	res.render("core");
});

app.post("/login", session, (req, res) => {
	return res.status(404).end();
});

app.post("/register", session, (req, res) => {
	return res.status(404).end();
});

const server = createServer(app);
const io = new Server(server);

// io.on("connection", (client) => {
// 	client.on("authenticate", (socket_id) => {
// 		client.send("authenticated", socket_id);
// 	});
// });

server.listen(3000, () => {
	console.log(`Listening at: http://127.0.0.1:3000/`);
});