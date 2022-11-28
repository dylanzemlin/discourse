import { NextApiRequest, NextApiResponse } from "next";
import pocket from "../../../lib/pocket";

export default async function Route(req: NextApiRequest, res: NextApiResponse) {
	const pb = await pocket();
	const { email, password } = req.body;

	// TODO: Hash password :)
	const users = pb.collection("users");
	try {
		const user = await users.getFirstListItem(`email = "${email}" AND password = "${password}"`);
		if (user == null) {
			res.status(401).json({ error: "Invalid email or password" });
			return;
		}

		// TODO: Create cookie and send it back to client along with their userid to store in localstorage
		res.status(200).json({ user });
	} catch (_) {
		res.status(401).json({ error: "Invalid email or password" });
		return;
	}
}