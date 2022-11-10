import { NextApiRequest, NextApiResponse } from "next";

export default function Route(req: NextApiRequest, res: NextApiResponse) {
	if (!req.cookies?.token) {
		return res.status(401).end();
	}

	
}