import PocketBase from "pocketbase";

let pb: PocketBase | undefined = undefined;
export default async function pocket() {
  if (pb == undefined) {
    pb = new PocketBase(process.env.POCKETBASE_URL as string);
    await pb.admins.authWithPassword(process.env.POCKETBASE_EMAIL as string, process.env.POCKETBASE_PASSWORD as string);
  }

  return pb;
}