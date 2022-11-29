import HttpStatusCode from "../../../../lib/api/HttpStatusCode";
import { withSessionRoute } from "../../../../lib/iron";
import { NextApiRequest, NextApiResponse } from "next";
import pocket from "../../../../lib/pocket";

async function getUserSettings(req: NextApiRequest, res: NextApiResponse) {
  const pb = await pocket();
  let user;
  try {
    user = await pb.collection("users").getFirstListItem<any>(`id = "${req.session.user?.id}"`);
  } catch (e) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error_code: HttpStatusCode.UNAUTHORIZED,
      error_text: "UNAUTHORIZED"
    });
  }
  
  return res.status(HttpStatusCode.OK).json({
    ...(user.settings)
  });
}

async function updateUserSettings(req: NextApiRequest, res: NextApiResponse) {
}

export default withSessionRoute(function UserSettingsRoute(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if(req.session?.user == null) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      error_code: HttpStatusCode.UNAUTHORIZED,
      error_text: "UNAUTHORIZED"
    });
    return;
  }

  switch (method) {
    case 'GET':
      return getUserSettings(req, res);
    case 'PUT':
      return updateUserSettings(req, res);
    default:
      return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).json({
        error_code: HttpStatusCode.METHOD_NOT_ALLOWED,
        error_text: "METHOD_NOT_ALLOWED",
      });
  }
})