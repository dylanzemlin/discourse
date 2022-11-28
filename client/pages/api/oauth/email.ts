import { DiscourseErrorCode } from "../../../lib/api/DiscourseErrorCode";
import { generateSalt, hashPassword } from "../../../lib/crypto";
import HttpStatusCode from "../../../lib/api/HttpStatusCode";
import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "../../../lib/iron";
import pocket from "../../../lib/pocket";

const login = async (req: NextApiRequest, res: NextApiResponse) => {
	const { email, password } = req.query;
	const pb = await pocket();

	try {
		const user = await pb.collection("users").getFirstListItem<any>(`email = "${email}"`);
		if (user.auth_type !== "password") {
			return res.status(HttpStatusCode.BAD_REQUEST).json({
				error_code: DiscourseErrorCode.AUTH_USE_SERVICE,
				error_text: "AUTH_USE_SERVICE",
				service: user.auth_type
			});
		}

		const hashedPassword = await hashPassword(password as string, user.salt);
		if (hashedPassword != user.password) {
			return res.status(HttpStatusCode.BAD_REQUEST).json({
				error_code: DiscourseErrorCode.AUTH_BAD_CREDENTIALS,
				error_text: "AUTH_BAD_CREDENTIALS"
			});
		}

		req.session.user = {
			id: user.id,
			email: user.email,
			name: user.name,
			username: user.username
		}
		await req.session.save();

		// TODO: Determine if the state has a redirectTo value and redirect to that
		return res.redirect(req.query.returnTo as string ?? "/chaos");
	} catch (_) {
		return res.status(HttpStatusCode.BAD_REQUEST).json({
			error_code: DiscourseErrorCode.AUTH_BAD_CREDENTIALS,
			error_text: "AUTH_BAD_CREDENTIALS"
		});
	}
}

const register = async (req: NextApiRequest, res: NextApiResponse) => {
	const { username, name, email, password } = req.query;
	const pb = await pocket();

	try {
		const user = await pb.collection("users").getFirstListItem<any>(`email = "${email}"`);
		if (user.auth_type !== "password") {
			return res.status(HttpStatusCode.BAD_REQUEST).json({
				error_code: DiscourseErrorCode.AUTH_USE_SERVICE,
				error_text: "AUTH_USE_SERVICE",
				service: user.auth_type
			});
		}

		return res.status(HttpStatusCode.BAD_REQUEST).json({
			error_code: DiscourseErrorCode.AUTH_EMAIL_EXISTS,
			error_text: "AUTH_EMAIL_EXISTS"
		});
	} catch {
		// No user exists, we create it
		console.log("generating salt");
		const salt = await generateSalt();
		console.log("hashing password");
		const hash = await hashPassword(password as string, salt);
		console.log("creating user");
		const user = await pb.collection("users").create({
			username,
			name,
			email,
			auth_type: "password",
			auth_email_hash: hash,
			auth_email_salt: salt
		});

		console.log("creating session");
		req.session.user = {
			id: user.id,
			email: user.email,
			name: user.name,
			username: user.username
		}

		console.log("saving session");
		await req.session.save();

		console.log("redirecting");
		return res.status(HttpStatusCode.CREATED).json({
			success: true
		})
	}
}

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
	console.log(req.method);
	if (req.method === "GET") {
		return login(req, res);
	}

	if (req.method === "POST") {
		return register(req, res);
	}

	return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).json({
		error_code: DiscourseErrorCode.BAD_METHOD,
		error_text: "BAD_METHOD"
	});
})