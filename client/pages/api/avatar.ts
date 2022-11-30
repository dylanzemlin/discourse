import HttpStatusCode from "../../lib/api/HttpStatusCode";
import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "../../lib/iron";
import pocket from "../../lib/pocket";

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
  const pb = await pocket();
  const avatars = pb.collection("avatars");
  try {
    const avatar = await avatars.getFirstListItem(`uid = "${req.query.id}"`);
    const avatarFile = pb.getFileUrl(avatar, avatar.file);
    return res.redirect(avatarFile);
  } catch (e) {
    const defaultAvatar = await avatars.getFirstListItem(`uid = "default"`);
    console.log(defaultAvatar);
    const avatarFile = pb.getFileUrl(defaultAvatar, defaultAvatar.file);
    return res.redirect(avatarFile);
  }
})