import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";
import { generateSalt, hashPassword } from "@lib/crypto";
import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";

const login = async (req: NextApiRequest, res: NextApiResponse) => {
	const { email, password } = req.query;
	const pb = await pocket();

	try {
		const user = await pb.collection("users").getFirstListItem<any>(`email = "${email}"`);
		if (user.auth_type !== "password") {
			return res.status(HttpStatusCode.BAD_REQUEST).json({
				error: "account_uses_" + user.auth_type,
				auth_source: "Login"
			});
		}

		const hashedPassword = await hashPassword(password as string, user.auth_email_salt);
		if (hashedPassword !== user.auth_email_hash) {
			return res.status(HttpStatusCode.UNAUTHORIZED).json({
				error: "invalid_credentials",
				auth_source: "Login"
			});
		}

		req.session.user = {
			id: user.id,
			email: user.email,
			displayname: user.settings.displayName,
			username: user.username,
			flags: user.flags,
			color: user.settings.color
		}
		await req.session.save();
		return res.status(HttpStatusCode.OK).end();
	} catch (_) {
		return res.status(HttpStatusCode.UNAUTHORIZED).json({
			error: "invalid_credentials",
			auth_source: "Login"
		});
	}
}

const register = async (req: NextApiRequest, res: NextApiResponse) => {
	const { username, displayname, email, password } = req.query;
	const pb = await pocket();

	try {
		await pb.collection("users").getFirstListItem<any>(`email = "${email}"`);
		return res.status(HttpStatusCode.BAD_REQUEST).json({
			error: "email_already_used",
			auth_source: "Registration"
		});
	} catch {
		// No user exists, we create it
		const salt = await generateSalt();
		const hash = await hashPassword(password as string, salt);
		const user = await pb.collection("users").create<any>({
			email,
			username: username,
			auth_type: "password",
			auth_email_hash: hash,
			auth_email_salt: salt,
			flags: DiscouseUserFlags.None.valueOf(),
			settings: {
				displayName: displayname ?? username,
				theme: "dark",
				color: "#22A39F"
			}
		});

		req.session.user = {
			id: user.id,
			email: user.email,
			displayname: user.settings.displayName,
			username: user.username,
			flags: user.flags,
			color: user.settings.color
		}

		await req.session.save();
		return res.status(HttpStatusCode.OK).end();
	}
}

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "GET") {
		return login(req, res);
	}

	if (req.method === "POST") {
		return register(req, res);
	}

	return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).end();
})