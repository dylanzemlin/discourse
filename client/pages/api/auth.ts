import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") {
		return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).json({ error: "Not found" });
	}

	if (!req.session.user) {
		return res.status(HttpStatusCode.UNAUTHORIZED).end();
	}

	const pb = await pocket();
	let user: any | undefined = undefined;
	try {
		user = await pb.collection("users").getFirstListItem<any>(`id = "${req.session.user.id}"`);
	} catch (e: any) {
		// This is really scuffed but it'll have to work :P
		if(e.status == 403) {
			return setTimeout(() => {
				Route(req, res);
			}, 500);
		}
		
		return res.status(HttpStatusCode.UNAUTHORIZED).end();
	}

	const keys = ["auth_email_hash", "auth_email_salt", "collectionId", "collectionName", "updated", "expand", "auth_type"];
	keys.forEach(key => delete user?.[key]);

	return res.status(HttpStatusCode.OK).json({
		...(user)
	});
})