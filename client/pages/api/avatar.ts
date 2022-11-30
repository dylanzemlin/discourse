import HttpStatusCode from "../../lib/api/HttpStatusCode";
import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "../../lib/iron";
import pocket from "../../lib/pocket";
import formidable from "formidable";
import FormData from "form-data";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  }
}

async function getAvatar(req: NextApiRequest, res: NextApiResponse) {
  const pb = await pocket();
  const avatars = pb.collection("avatars");
  try {
    const avatar = await avatars.getFirstListItem(`uid = "${req.session.user?.id}"`);
    const avatarFile = pb.getFileUrl(avatar, avatar.file);
    return res.redirect(avatarFile);
  } catch (e) {
    const defaultAvatar = await avatars.getFirstListItem(`uid = "default"`);
    console.log(defaultAvatar);
    const avatarFile = pb.getFileUrl(defaultAvatar, defaultAvatar.file);
    return res.redirect(avatarFile);
  }
}

async function setAvatar(req: NextApiRequest, res: NextApiResponse) {
  const pb = await pocket();
  const avatars = pb.collection("avatars");

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: err.message,
      });
    }

    const file = files.file as formidable.File;
    const filePath = file.filepath;
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath)); 
    
    try {
      const avatar = await avatars.getFirstListItem(`uid = "${req.session.user?.id}"`);
      avatars.update(avatar.id, form);
    } catch {
      form.append("uid", req.session.user?.id ?? "");
      await avatars.create(form);
    }

    return res.status(HttpStatusCode.OK).end();
  });
}

export default withSessionRoute(async function Route(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return getAvatar(req, res);
    case "PATCH":
      return setAvatar(req, res);
    default:
      return res.status(HttpStatusCode.METHOD_NOT_ALLOWED).end();
  }
})