import pool from "../../database/index.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import {
  comparePassword,
  generateToken,
  hashPassword,
} from "../../utils/authUtils.js";
import { StatusCodes } from "http-status-codes";

const signup = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await hashPassword(password);
  const userRole = role === "maintainer" ? "maintainer" : "contributor";

  const result = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at",
    [name, email, hashedPassword, userRole],
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User registered successfully",
    data: result.rows[0],
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  const user = result.rows[0];

  if (!user || !(await comparePassword(password, user.password))) {
    throw Object.assign(new Error("Invalid credentials"), {
      statusCode: StatusCodes.UNAUTHORIZED,
    });
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
    role: user.role,
  });
  delete user.password;

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Login successful",
    data: { token, user },
  });
});

export const AuthControllers = {
  signup,
  login,
};
