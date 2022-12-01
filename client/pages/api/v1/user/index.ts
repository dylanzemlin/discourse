import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";

const deleteUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const ps = await pocket();

  try {
    const user = await ps.collection("users").getFirstListItem(`id = "${req.session.user?.id}"`);
    await ps.collection("users").delete(user.id);
  } catch {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
  }

  try {
    const avatar = await ps.collection("avatars").getFirstListItem(`uid = "${req.session.user?.id}"`);
    await ps.collection("avatars").delete(avatar.id);
  } catch { /* ignore */ }

  req.session.destroy();
  return res.status(HttpStatusCode.OK).json({ message: "OK" });
}

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
  if (req.session.user == null) {
    return res.status(HttpStatusCode.UNAUTHORIZED).end();
  }

  switch(req.method) {
    case "DELETE":
      return deleteUser(req, res);
    default:
      return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).end();
  }
});