import { existsSync, mkdirSync, appendFileSync, unlinkSync, createReadStream } from "fs";
import { DiscourseErrorCode } from "@lib/api/DiscourseErrorCode";
import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";
import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";
import FormData from "form-data";

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
	const pb = await pocket();
	const { code } = req.query;

	if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "production") {
		console.error(`[/api/oauth/github] Bad Node ENV: ${process.env.NODE_ENV}`);
		return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
			error_code: DiscourseErrorCode.SERVER_BAD_ENVIRONMENT,
			error_text: "SERVER_BAD_ENVIRONMENT"
		});
	}

	const params = new URLSearchParams({
		client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID as string,
		client_secret: process.env[`GITHUB_CLIENT_SECRET_${process.env.NODE_ENV.toUpperCase()}`] as string,
		redirect_uri: process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI as string,
		code: code as string
	});
	const uri = `https://github.com/login/oauth/access_token?${params.toString()}`;

	const authResponse = await fetch(uri, {
		method: "POST",
		headers: {
			"Accept": "application/json"
		}
	});

	if (authResponse.status !== HttpStatusCode.OK) {
		return res.status(HttpStatusCode.BAD_REQUEST).json({
			error_code: DiscourseErrorCode.OAUTH_FAILED,
			error_text: "OAUTH_FAILED",

			response_code: authResponse.status,
			response_text: authResponse.statusText,
			response_body: await authResponse.text()
		});
	}

	const { access_token, scope } = await authResponse.json();
	if (!(scope as string).includes("user:email")) {
		return res.status(HttpStatusCode.BAD_REQUEST).json({
			error_code: DiscourseErrorCode.OAUTH_BAD_SCOPES,
			error_text: "OAUTH_BAD_SCOPES"
		});
	}

	const userResponse = await fetch("https://api.github.com/user", {
		headers: {
			"Authorization": `Bearer ${access_token}`
		}
	});

	if (userResponse.status !== HttpStatusCode.OK) {
		return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
			error_code: DiscourseErrorCode.OAUTH_API_ERROR,
			error_text: "OAUTH_API_ERROR",

			response_code: userResponse.status,
			response_text: userResponse.statusText,
			response_body: await userResponse.text()
		});
	}

	const { login, email, name, avatar_url } = await userResponse.json();
	let user;
	try {
		user = await pb.collection("users").getFirstListItem<any>(`email = "${email}"`);
		if (user.auth_type !== "github") {
			return res.status(HttpStatusCode.BAD_REQUEST).json({
				error_code: DiscourseErrorCode.OAUTH_EMAIL_ALREADY_USED,
				error_text: "OAUTH_EMAIL_ALREADY_USED"
			});
		}
	} catch (e) {
		user = await pb.collection("users").create({
			email,
			username: login,
			auth_type: "github",
			flags: DiscouseUserFlags.None,
			settings: {
				displayName: name ?? login,
				theme: "dark"
			}
		});

		const avatar_result = await fetch(avatar_url);
		if (avatar_result.ok) {
			if (!existsSync("./tmp")) {
				mkdirSync("./tmp");
			}

			appendFileSync(`./tmp/${user.id}.png`, Buffer.from(await avatar_result.arrayBuffer()));

			const form = new FormData();
			form.append("file", createReadStream(`./tmp/${user.id}.png`));
			form.append("uid", user.id);

			await pb.collection("avatars").create(form);
			unlinkSync(`./tmp/${user.id}.png`);
		}
	}

	req.session.user = {
		id: user.id,
		email: user.email,
		displayname: user.settings.displayName,
		username: user.username,
		flags: user.flags
	}
	await req.session.save();

	// TODO: Determine if the state has a redirectTo value and redirect to that
	return res.redirect("/chaos");
});