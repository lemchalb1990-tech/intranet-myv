import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { signToken, verifyToken, JwtPayload } from "./jwt";

export { signToken, verifyToken };
export type { JwtPayload };

const COOKIE_NAME = "auth_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { client: true },
  });

  return user;
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
