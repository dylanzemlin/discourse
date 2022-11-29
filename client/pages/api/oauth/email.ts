import { DiscourseErrorCode } from "../../../lib/api/DiscourseErrorCode";
import { DiscouseUserFlags } from "../../../lib/api/DiscourseUserFlags";
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

		const hashedPassword = await hashPassword(password as string, user.auth_email_salt);
		if (hashedPassword !== user.auth_email_hash) {
			return res.status(HttpStatusCode.BAD_REQUEST).json({
				error_code: DiscourseErrorCode.AUTH_BAD_CREDENTIALS,
				error_text: "AUTH_BAD_CREDENTIALS"
			});
		}

		req.session.user = {
			id: user.id,
			email: user.email,
			name: user.settings.name,
			username: user.username,
			flags: user.flags
		}
		await req.session.save();
		return res.status(HttpStatusCode.OK).json({
			success: true
		});
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
		const salt = await generateSalt();
		const hash = await hashPassword(password as string, salt);
		const user = await pb.collection("users").create<any>({
			email,
			username: username ?? (name as string).toLowerCase().replace(" ", "_"),
			auth_type: "password",
			auth_email_hash: hash,
			auth_email_salt: salt,
			flags: DiscouseUserFlags.None,
			settings: {
				name: name ?? username,
				avatar: null,
				theme: "dark"
			}
		});

		req.session.user = {
			id: user.id,
			email: user.email,
			name: user.settings.name,
			username: user.username,
			flags: user.flags
		}

		await req.session.save();

		return res.status(HttpStatusCode.CREATED).json({
			success: true
		})
	}
}

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "GET") {
		return login(req, res);
	}

	if (req.method === "POST") {
		return register(req, res);
	}

	return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).json({
		error_code: HttpStatusCode.METHOD_NOT_ALLOWED,
		error_text: "METHOD_NOT_ALLOWED"
	});
})