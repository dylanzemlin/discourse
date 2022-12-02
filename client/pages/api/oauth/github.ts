import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";
import { existsSync, mkdirSync, appendFileSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";
import fetch from "node-fetch";

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
	if (!process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED || process.env[`GITHUB_CLIENT_SECRET_${process.env.NODE_ENV.toUpperCase()}`] == null) {
		return res.redirect(`/?error=oauth_github_not_enabled&error_source=Github OAuth`);
	}

	const pb = await pocket();
	const { code } = req.query;

	if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "production") {
		console.error(`[/api/oauth/github] Bad Node ENV: ${process.env.NODE_ENV}`);
		return res.redirect(`/?error=internal_server_error&error_source=Github OAuth`);
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
		return res.redirect(`/?error=github_oauth_failed&error_source=Github OAuth`);
	}

	const { access_token } = await authResponse.json() as any;
	const userResponse = await fetch("https://api.github.com/user", {
		headers: { "Authorization": `Bearer ${access_token}` }
	});
	if (userResponse.status !== HttpStatusCode.OK) {
		return res.redirect(`/?error=api_user_failed&error_source=Github OAuth`);
	}

	const emailResponse = await fetch("https://api.github.com/user/emails", {
		headers: { "Authorization": `Bearer ${access_token}` }
	});
	if (emailResponse.status !== HttpStatusCode.OK) {
		return res.redirect(`/?error=api_email_failed&error_source=Github OAuth`);
	}

	const emails: any[] = await emailResponse.json() as any;
	const email = emails.find(e => e.primary)?.email ?? emails[0]?.email;
	if (email == null) {
		return res.redirect(`/?error=no_email_found&error_source=Github OAuth`);
	}

	const { login, name, avatar_url } = await userResponse.json() as any;

	let user;
	try {
		user = await pb.collection("users").getFirstListItem<any>(`email = "${email}"`);
		if (user.auth_type !== "github") {
			return res.redirect(`/?error=email_already_used&error_source=Github OAuth`);
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