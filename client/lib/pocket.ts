import PocketBase from "pocketbase";

let pb: PocketBase | null = null;
let wait_callback: ((value: any) => void) | null = null;
let authorized = false;

export default async function pocket() {
  if (pb == null) {
    pb = new PocketBase(process.env.POCKETBASE_URL as string);
    await pb.admins.authWithPassword(process.env.POCKETBASE_EMAIL as string, process.env.POCKETBASE_PASSWORD as string);
    pb.autoCancellation(false);
    authorized = true;

    if(wait_callback) {
      wait_callback(null);
    }
  }

  return pb;
}