import bcrypt from "bcrypt";

import config from "../config/index.js";
import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: number;
  name: string;
  role: string;
}

export const hashPassword = async (password: string) =>
  bcrypt.hash(password, config.bcrypt_salt_rounds);

export const comparePassword = async (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);

export const generateToken = (payload: TokenPayload) => {
  return jwt.sign(
    payload,
    config.jwt_secret as string,
    {
      expiresIn: config.jwt_expires_in as string,
    } as SignOptions,
  );
};
