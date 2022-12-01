import fs from "fs";

export function getSavedAvatar(uid: string): Buffer {
  if(!fs.existsSync(`./public/avatars/${uid}.png`)) {
    return fs.readFileSync(`./public/default_avatar.jpg`);
  }

  return fs.readFileSync(`./public/avatars/${uid}.png`);
}

export function saveAvatar(uid: string, buffer: Buffer): void {
  if(!fs.existsSync("./public/avatars")) {
    fs.mkdirSync("./public/avatars");
  }
  fs.writeFileSync(`./public/avatars/${uid}.png`, buffer);
}