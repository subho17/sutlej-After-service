import bcrypt from "bcryptjs";

const COST = 10;

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifySecret(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
