import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

export const hashPassword = async (password: string) =>
  bcrypt.hash(password, config.bcrypt_salt_rounds);
export const comparePassword = async (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);
export const generateToken = (payload: object) =>
  jwt.sign(payload, config.jwt_secret as string, {
    expiresIn: config.jwt_expires_in,
  });
