import HttpStatusCode from "../../lib/api/HttpStatusCode";
import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "../../lib/iron";

export default withSessionRoute(function Route(req: NextApiRequest, res: NextApiResponse) {
  return res.redirect("https://cdn.discordapp.com/embed/avatars/0.png");
})