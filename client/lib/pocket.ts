import PocketBase from "pocketbase";

async function createConnection() {
  const pb = new PocketBase(process.env.POCKETBASE_URL as string);
  await pb.admins.authWithPassword(process.env.POCKETBASE_EMAIL as string, process.env.POCKETBASE_PASSWORD as string);
  pb.autoCancellation(false);

  // Create collection if it doesn't exist
  try {
    await pb.collections.getFirstListItem(`name = "users"`);
  } catch {
    await pb.collections.create({
      name: "users",
      type: "base",
      schema: [{
        name: "username",
        type: "text",
        required: true,
        unique: false,
        options: { min: null, max: null, pattern: '' }
      }, {
        name: "email",
        type: "text",
        required: true,
        unique: true,
        options: { min: null, max: null, pattern: '' }
      }, {
        name: "flags",
        type: "number",
        required: false,
        unique: false,
        options: { min: null, max: null }
      }, {
        name: "auth_type",
        type: "text",
        required: true,
        unique: false,
        options: { min: null, max: null, pattern: '^\\w+$' }
      }, {
        name: "auth_email_hash",
        type: "text",
        required: false,
        unique: false,
        options: { min: null, max: null, pattern: '' }
      }, {
        name: "auth_email_salt",
        type: "text",
        required: false,
        unique: false,
        options: { min: null, max: null, pattern: '' }
      }, {
        name: "settings",
        type: "json",
        required: false,
        unique: false,
        options: {}
      }]
    });
  }
  
  return pb;
}

let pb: PocketBase | null = null;
export default async function pocket(): Promise<PocketBase> {
  if (process.env.NODE_ENV === "production") {
    if (pb === null) {
      pb = await createConnection();
    }

    return pb;
  }

  if ((global as any).pb != undefined) {
    return (global as any).pb;
  }

  (global as any).pb = await createConnection();
  return (global as any).pb;
}