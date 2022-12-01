import { DiscourseErrorCode } from "@lib/api/DiscourseErrorCode";
import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";
import { existsSync, mkdirSync, appendFileSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import formurlencoded from "form-urlencoded";
import pocket from "@lib/pocket";
import fetch from "node-fetch";

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query;
	if(!process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED || process.env[`GOOGLE_CLIENT_SECRET`] == null) {
		res.status(HttpStatusCode.NOT_FOUND).end();
		return;
	}

  if (error) {
    return res.redirect(`/?error=${error}`);
  }

  if (!code) {
    return res.redirect(`/?error=internal_server_error:0`);
  }

  const form = {
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    client_secret: process.env[`GOOGLE_CLIENT_SECRET`],
    redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
    code: code as string
  }
  const result = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formurlencoded(form)
  });
  if (!result.ok) {
    return res.redirect(`/?error=internal_server_error:1`);
  }

  const { access_token } = await result.json() as any;
  const profileInfo = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
    headers: {
      "Authorization": `Bearer ${access_token}`
    }
  });
  if (!profileInfo.ok) {
    return res.redirect(`/?error=internal_server_error:2`);
  }

  const { email, name, picture, given_name } = await profileInfo.json() as any;
  const pb = await pocket();
  let user;
  try {
    user = await pb.collection("users").getFirstListItem<any>(`email = "${email}"`);
    if (user.auth_type !== "google") {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error_code: DiscourseErrorCode.OAUTH_EMAIL_ALREADY_USED,
        error_text: "OAUTH_EMAIL_ALREADY_USED"
      });
    }
  } catch (e) {
    user = await pb.collection("users").create({
      email,
      username: (name as string)?.toLowerCase().replace(" ", ""),
      auth_type: "google",
      flags: DiscouseUserFlags.None.valueOf(),
      settings: {
        displayName: given_name ?? name,
        theme: "dark",
        color: "#22A39F"
      }
    });

    const avatar_result = await fetch(picture);
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