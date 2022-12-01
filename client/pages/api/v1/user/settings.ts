import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import pocket from "@lib/pocket";

async function getUserSettings(req: NextApiRequest, res: NextApiResponse) {
  const pb = await pocket();
  let user: any | undefined = undefined;
  try {
    user = await pb.collection("users").getFirstListItem<any>(`id = "${req.session.user?.id}"`);
  } catch (e) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error_code: HttpStatusCode.UNAUTHORIZED,
      error_text: "UNAUTHORIZED"
    });
  }

  // Remove the following keys from user
  const keys = ["auth_email_hash", "auth_email_salt", "collectionId", "collectionName", "updated", "expand", "auth_type"];
  keys.forEach(key => delete user?.[key]);

  return res.status(HttpStatusCode.OK).json({
    ...(user)
  });
}

async function updateUserSettings(req: NextApiRequest, res: NextApiResponse) {
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

  const settings = req.body;
  // TODO: Verify settings does not contain weird stuff
  await pb.collection("users").update(user.id, {
    settings: settings
  });

  return res.status(HttpStatusCode.OK).json({
    ...(settings)
  });
}

export default withSessionRoute(function UserSettingsRoute(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (req.session?.user == null) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      error_code: HttpStatusCode.UNAUTHORIZED,
      error_text: "UNAUTHORIZED"
    });
    return;
  }

  switch (method) {
    case 'GET':
      return getUserSettings(req, res);
    case 'PATCH':
      return updateUserSettings(req, res);
    default:
      return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).json({
        error_code: HttpStatusCode.METHOD_NOT_ALLOWED,
        error_text: "METHOD_NOT_ALLOWED",
      });
  }
})