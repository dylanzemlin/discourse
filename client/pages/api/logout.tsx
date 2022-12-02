import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import { destroyCookie } from "nookies";

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
  req.session.destroy();
  destroyCookie({ res }, "discourse-session");
  res.status(HttpStatusCode.OK).end();
})