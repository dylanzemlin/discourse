import { DiscouseUserFlags, hasFlag } from "@lib/api/DiscourseUserFlags";
import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";

async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  const pb = await pocket();
  const users = await pb.collection("users").getFullList<any>();

  const forbidden_keys = ["auth_email_hash", "auth_email_salt", "collectionId", "collectionName", "updated", "expand"];
  for (const user of users) {
    for (const key of forbidden_keys) {
      delete user[key];
    }
  }

  return res.status(HttpStatusCode.OK).json(users);
}

async function deleteUser(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const pb = await pocket();
  try {
    await pb.collection("users").delete(id as string);
  } catch {
    return res.status(HttpStatusCode.NOT_FOUND).end();
  }

  return res.status(HttpStatusCode.OK).end();
}

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
  if (req.session.user == null || !hasFlag(req.session.user.flags, DiscouseUserFlags.Admin)) {
    return res.status(HttpStatusCode.NOT_FOUND).end();
  }

  switch (req.method) {
    case "GET":
      return getUsers(req, res);
    case "DELETE":
      return deleteUser(req, res);
    default:
      return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).end();
  }
});