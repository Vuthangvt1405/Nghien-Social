import bcrypt from "bcrypt";

export class PasswordUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds: number = parseInt(process.env.SALT_ROUNDS as string);
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
