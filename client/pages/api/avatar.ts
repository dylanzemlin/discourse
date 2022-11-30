import { getSavedAvatar, saveAvatar } from "@lib/server/avatars";
import { NextApiRequest, NextApiResponse } from "next";
import HttpStatusCode from "@lib/api/HttpStatusCode";
import { withSessionRoute } from "@lib/iron";
import { readFileSync } from "fs";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  }
}

async function getAvatar(req: NextApiRequest, res: NextApiResponse) {
  if (req.session?.user?.id == null && req.query.uid == null) {
    return res.status(HttpStatusCode.UNAUTHORIZED).end();
  }

  const avatar = getSavedAvatar(req.query.uid as string ?? req.session.user?.id);
  res.setHeader("Content-Type", "image/png");
  res.status(HttpStatusCode.OK).send(avatar);
}

async function setAvatar(req: NextApiRequest, res: NextApiResponse) {
  if (req.session?.user?.id == null) {
    return res.status(HttpStatusCode.UNAUTHORIZED).end();
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: err.message,
      });
    }
    const file = files.file as formidable.File;
    saveAvatar(req.session.user!.id, readFileSync(file.filepath));
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