import dotenv from "dotenv";
dotenv.config();

console.log("Node Environment: " + process.env.NODE_ENV);

import { Firestore } from "@google-cloud/firestore";
const store = new Firestore();

import { auth, ConfigParams } from "express-openid-connect";
import createSocket from "./socket";
import { createServer, Server } from "http";
import express from "express";
import path from "path";
import { generateSalt, hashPassword } from "./crypto";

const openidConfig: ConfigParams = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};

const app = express();
app.set("view engine", "ejs");

app.use(auth(openidConfig));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../", "public")));

// This is a bad idea, just share the specific modules later on
app.use(express.static(path.join(__dirname, "../", "node_modules")));

app.get("/", (req, res) => {
  res.render("index", {
    user: req.oidc.user == null ? false : true,
  });
});

app.get("/status", async (req, res) => {
  const test = store.collection("example").doc("test");
  const doc = await test.get();
  res.json(doc.data());
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (email == null || password == null) {
    return res.status(400).send("Missing email or password");
  }

  const user = await store
    .collection("users")
    .where("email", "==", email)
    .get();

  if (user == null || user.empty) {
    return res.status(400).send("Invalid email or password");
  }

  const userData = user.docs[0].data();
  const hashedPassword = await hashPassword(password, userData.salt);
  if (hashedPassword !== userData.password) {
    return res.status(400).send("Invalid email or password");
  }

  // TODO: Set cookie
  return res.status(200).send("Success");
});

app.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (email == null || password == null || name == null) {
    return res.status(400).send("Invalid body");
  }

  const user = await store
    .collection("users")
    .where("email", "==", email)
    .get();

  if (user != null && !user.empty) {
    return res.status(400).send("User already exists with that email");
  }

  const salt = await generateSalt();
  const hashedPassword = await hashPassword(password, salt);
  const avatarIndex = Math.floor(Math.random() * 6);

  await store.collection("users").add({
    email,
    name,
    password: hashedPassword,
    salt,
    createdAt: Date.now(),
    authenticationProvider: "manual",
    avatar: `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`,
  });

  // TOOD: Set cookie
  return res.status(200).send("Success");
});

app.post("/oauth/github", (req, res) => {
  return res.status(404).send("Not Found");
});

app.post("/oauth/google", (req, res) => {
  return res.status(404).send("Not Found");
});

app.get("/core", (req, res) => {
  // If the user is null and the dev param is not set (while in development mode), redirect to login
  if (
    req.oidc?.user == null &&
    (req.query.dev != "true" || process.env.NODE_ENV != "development")
  ) {
    return res.redirect("/login");
  }

  res.render("core", {
    environment: process.env.NODE_ENV,
    user: req.oidc.user ?? {
      name: "John Doe",
      email: "john.doe@gmail.com",
      picture: "https://cdn.discordapp.com/embed/avatars/0.png",
    },
  });
});

const server: Server = createServer(app);
server.listen(3000, () => {
  createSocket(server);
  console.log(`Listening at: http://127.0.0.1:3000/`);
});
