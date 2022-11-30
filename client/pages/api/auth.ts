import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";

export default withSessionRoute(function Route(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "DELETE") {
		req.session.destroy();
		return res.status(HttpStatusCode.OK).json({ success: true });
	}

	if (req.method !== "GET") {
		return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).json({ error: "Not found" });
	}

	if (!req.session.user) {
		return res.status(HttpStatusCode.UNAUTHORIZED).end();
	}

	return res.status(HttpStatusCode.OK).json({
		...req.session.user
	});
})