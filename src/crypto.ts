import bcrypt from "bcrypt";

export const hashPassword = async (password: string, salt: string) => {
  return bcrypt.hash(
    process.env.PEPPER as string,
    await bcrypt.hash(password, salt)
  );
};

export const generateSalt = async () => await bcrypt.genSalt(30);