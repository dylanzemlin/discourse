import { DiscourseErrorCode } from "@lib/api/DiscourseErrorCode";
import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";
import { existsSync, mkdirSync, appendFileSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";
import fetch from "node-fetch";

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
	if(!process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED || process.env[`GITHUB_CLIENT_SECRET_${process.env.NODE_ENV.toUpperCase()}`] == null) {
		res.status(HttpStatusCode.NOT_FOUND).end();
		return;
	}

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

	const { access_token, scope } = await authResponse.json() as any;
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

	const { login, email, name, avatar_url } = await userResponse.json() as any;
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
			flags: DiscouseUserFlags.None.valueOf(),
			settings: {
				displayName: name ?? login,
				theme: "dark",
				color: "#22A39F"
			}
		});

		const avatar_result = await fetch(avatar_url);
    if (avatar_result.ok) {
      if (!existsSync("./public/avatars")) {
        mkdirSync("./public/avatars");
      }

      appendFileSync(`./public/avatars/${user.id}.png`, Buffer.from(await avatar_result.arrayBuffer()));
    }
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

	// TODO: Determine if the state has a redirectTo value and redirect to that
	return res.redirect("/chaos");
});