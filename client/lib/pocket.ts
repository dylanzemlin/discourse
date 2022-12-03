import PocketBase from "pocketbase";

let pb: PocketBase | null = null;

export default async function pocket() {
  if (pb == null) {
    pb = new PocketBase(process.env.POCKETBASE_URL as string);
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
  }
  
  if (!pb.authStore.isValid) {
    try {
      await pb.admins.authWithPassword(process.env.POCKETBASE_EMAIL as string, process.env.POCKETBASE_PASSWORD as string);
      pb.autoCancellation(false);
    } catch {
      return pb;
    }
  }

  return pb;
}