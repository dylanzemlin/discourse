import dotenv from "dotenv";
dotenv.config();

console.log("Node Environment: " + process.env.NODE_ENV);

import { auth, ConfigParams } from "express-openid-connect";
import createSocket from "./socket";
import { createServer, Server } from "http";
import express from "express";
import path from "path";

const openidConfig: ConfigParams = {
	authRequired: false,
	auth0Logout: true,
	secret: process.env.AUTH0_SECRET,
	baseURL: process.env.AUTH0_BASE_URL,
	clientID: process.env.AUTH0_CLIENT_ID,
	issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
}

const app = express();
app.set("view engine", "ejs");

app.use(auth(openidConfig));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../", "public")));

// This is a bad idea, just share the specific modules later on
app.use(express.static(path.join(__dirname, "../", "node_modules")));

app.get("/", (req, res) => {
	res.render("index", {
		user: req.oidc.user == null ? false : true
	});
});

app.get("/core", (req, res) => {
	// If the user is null and the dev param is not set (while in development mode), redirect to login
	// if (req.oidc?.user == null && (req.query.dev != "true" || process.env.NODE_ENV != "development")) {
	// 	return res.redirect("/login");
	// }

	res.render("core", {
    node_env: process.env.NODE_ENV,
    node_port: process.env.PORT ?? 3000
  });
});

const server: Server = createServer(app);
server.listen(process.env.PORT ?? 3000, () => {
	createSocket(server);
	console.log(`Listening at: http://127.0.0.1:${process.env.PORT ?? 3000}/`);
});