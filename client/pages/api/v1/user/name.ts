import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";

async function getName(req: NextApiRequest, res: NextApiResponse) {
  const pb = await pocket();
  const { uid } = req.query;
  if (uid == null) {
    return res.status(HttpStatusCode.BAD_REQUEST).end();
  }

  try {
    const user = await pb.collection("users").getFirstListItem<any>(`id = "${uid}"`);
    return res.status(HttpStatusCode.OK).send(user.settings?.displayName ?? user.username)
  } catch {
    return res.status(HttpStatusCode.NOT_FOUND).end();
  }
}

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return getName(req, res);
    default:
      return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).end();
  }
})