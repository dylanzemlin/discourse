import bcrypt from "bcrypt";

/**
 * Hashes a password using bcrypt
 * @param password The password to hash
 * @param salt A randomly generated salt to hash with the password
 * @returns A hashed password using a salt and pepper
 */
export const hashPassword = async (password: string, salt: string) => {
	return await bcrypt.hash(
		process.env.PEPPER as string,
		await bcrypt.hash(password, salt)
	);
};

/**
 * Generates a random salt
 * @returns A random salt
 */
export const generateSalt = async () => await bcrypt.genSalt(30);