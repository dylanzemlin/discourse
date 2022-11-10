import { NextApiRequest, NextApiResponse } from "next";

export default function Route(req: NextApiRequest, res: NextApiResponse) {
	if (!req.cookies?.token) {
		return res.status(401).end();
	}

	// TODO: Fetch user from database
	return res.status(200).json({});
}