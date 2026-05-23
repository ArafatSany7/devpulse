
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";
import cors from "cors";

// src/middlewares/notFound.ts
import { StatusCodes } from "http-status-codes";
var notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "API Endpoint Not Found", errors: "" });
};

// src/middlewares/globalErrorHandler.ts
import "express";
import { StatusCodes as StatusCodes2 } from "http-status-codes";
var globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes2.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.stack || err
  });
};

// src/modules/auth/auth.routes.ts
import { Router } from "express";

// src/modules/auth/auth.controller.ts
import "express";

// src/database/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config_default = {
  port: process.env.PORT || 5e3,
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET,
  jwt_expires_in: process.env.JWT_EXPIRES_IN,
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10
};

// src/database/index.ts
var pool = new Pool({ connectionString: config_default.database_url });
pool.on("error", (err) => {
  console.error("Unexpected error", err);
  process.exit(-1);
});
var database_default = pool;

// src/utils/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data
  });
};

// src/utils/authUtils.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var hashPassword = async (password) => bcrypt.hash(password, config_default.bcrypt_salt_rounds);
var comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);
var generateToken = (payload) => {
  return jwt.sign(
    payload,
    config_default.jwt_secret,
    {
      expiresIn: config_default.jwt_expires_in
    }
  );
};

// src/modules/auth/auth.controller.ts
import { StatusCodes as StatusCodes3 } from "http-status-codes";
var signup = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await hashPassword(password);
  const userRole = role === "maintainer" ? "maintainer" : "contributor";
  const result = await database_default.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at",
    [name, email, hashedPassword, userRole]
  );
  sendResponse(res, {
    statusCode: StatusCodes3.CREATED,
    success: true,
    message: "User registered successfully",
    data: result.rows[0]
  });
});
var login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await database_default.query("SELECT * FROM users WHERE email = $1", [
    email
  ]);
  const user = result.rows[0];
  if (!user || !await comparePassword(password, user.password)) {
    throw Object.assign(new Error("Invalid credentials"), {
      statusCode: StatusCodes3.UNAUTHORIZED
    });
  }
  const token = generateToken({
    id: user.id,
    name: user.name,
    role: user.role
  });
  delete user.password;
  sendResponse(res, {
    statusCode: StatusCodes3.OK,
    success: true,
    message: "Login successful",
    data: { token, user }
  });
});
var AuthControllers = { signup, login };

// src/modules/auth/auth.routes.ts
var router = Router();
router.post("/signup", AuthControllers.signup);
router.post("/login", AuthControllers.login);
var AuthRoutes = router;

// src/modules/issues/issues.routes.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.controller.ts
import { StatusCodes as StatusCodes4 } from "http-status-codes";
var createIssue = catchAsync(async (req, res) => {
  const { title, description, type } = req.body;
  const reporter_id = req.user.id;
  const result = await database_default.query(
    "INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, description, type, reporter_id]
  );
  sendResponse(res, {
    statusCode: StatusCodes4.CREATED,
    success: true,
    message: "Issue created successfully",
    data: result.rows[0]
  });
});
var getAllIssues = catchAsync(async (req, res) => {
  const { sort = "newest", type, status } = req.query;
  let query = "SELECT * FROM issues WHERE 1=1";
  const values = [];
  let index = 1;
  if (type) {
    query += ` AND type = $${index++}`;
    values.push(type);
  }
  if (status) {
    query += ` AND status = $${index++}`;
    values.push(status);
  }
  query += sort === "oldest" ? " ORDER BY created_at ASC" : " ORDER BY created_at DESC";
  const issueResult = await database_default.query(query, values);
  const issues = issueResult.rows;
  if (issues.length === 0) {
    return sendResponse(res, {
      statusCode: StatusCodes4.OK,
      success: true,
      message: "No issues found",
      data: []
    });
  }
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const usersResult = await database_default.query(
    "SELECT id, name, role FROM users WHERE id = ANY($1)",
    [reporterIds]
  );
  const usersMap = new Map(
    usersResult.rows.map((user) => [user.id, user])
  );
  const formattedData = issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;
    return { ...issueData, reporter: usersMap.get(reporter_id) };
  });
  sendResponse(res, {
    statusCode: StatusCodes4.OK,
    success: true,
    message: "Issue retryeved successfully",
    data: formattedData
  });
});
var getSingleIssue = catchAsync(async (req, res) => {
  const { id } = req.params;
  const issueResult = await database_default.query("SELECT * FROM issues WHERE id = $1", [
    id
  ]);
  const issue = issueResult.rows[0];
  if (!issue) {
    throw Object.assign(new Error("Issue not found"), {
      statusCode: StatusCodes4.NOT_FOUND
    });
  }
  const userResult = await database_default.query(
    "SELECT id, name, role FROM users WHERE id = $1",
    [issue.reporter_id]
  );
  const { reporter_id, ...issueData } = issue;
  sendResponse(res, {
    statusCode: StatusCodes4.OK,
    success: true,
    message: "Issue retryeved",
    data: { ...issueData, reporter: userResult.rows[0] }
  });
});
var updateIssue = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const user = req.user;
  const checkResult = await database_default.query("SELECT * FROM issues WHERE id = $1", [
    id
  ]);
  const issue = checkResult.rows[0];
  if (!issue) {
    throw Object.assign(new Error("Not found"), {
      statusCode: StatusCodes4.NOT_FOUND
    });
  }
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id || issue.status !== "open") {
      throw Object.assign(new Error("Permission denied to edit this issue"), {
        statusCode: StatusCodes4.CONFLICT
      });
    }
  }
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setString = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");
  values.push(id);
  const updateQuery = `UPDATE issues SET ${setString}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
  const result = await database_default.query(updateQuery, values);
  sendResponse(res, {
    statusCode: StatusCodes4.OK,
    success: true,
    message: "Issue updated successfully",
    data: result.rows[0]
  });
});
var deleteIssue = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await database_default.query(
    "DELETE FROM issues WHERE id = $1 RETURNING *",
    [id]
  );
  if (result.rowCount === 0) {
    throw Object.assign(new Error("Not found"), {
      statusCode: StatusCodes4.NOT_FOUND
    });
  }
  sendResponse(res, {
    statusCode: StatusCodes4.OK,
    success: true,
    message: "Issue deleted successfully"
  });
});
var IssueControllers = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middlewares/auth.middleware.ts
import jwt2 from "jsonwebtoken";
import { StatusCodes as StatusCodes5 } from "http-status-codes";
var auth = (...requiredRoles) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) throw new Error("No token provided");
      const decoded = jwt2.verify(
        token,
        config_default.jwt_secret
      );
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        throw Object.assign(new Error("Forbidden Access"), {
          statusCode: StatusCodes5.FORBIDDEN
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(
        Object.assign(new Error("Unauthorized access"), {
          statusCode: StatusCodes5.UNAUTHORIZED
        })
      );
    }
  };
};

// src/modules/issues/issues.routes.ts
var router2 = Router2();
router2.post(
  "/",
  auth("contributor", "maintainer"),
  IssueControllers.createIssue
);
router2.get("/", IssueControllers.getAllIssues);
router2.get("/:id", IssueControllers.getSingleIssue);
router2.patch(
  "/:id",
  auth("contributor", "maintainer"),
  IssueControllers.updateIssue
);
router2.delete("/:id", auth("maintainer"), IssueControllers.deleteIssue);
var IssueRoutes = router2;

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", AuthRoutes);
app.use("/api/issues", IssueRoutes);
app.use(notFound);
app.use(globalErrorHandler);
var app_default = app;

// src/database/init.ts
var initializeDatabase = async () => {
  const client = await database_default.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
        type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query("COMMIT");
    console.log("Database tables initialized");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database init error:", error);
  } finally {
    client.release();
  }
};

// src/server.ts
async function bootstrap() {
  try {
    await initializeDatabase();
    app_default.listen(config_default.port, () => {
      console.log(`Server running on port ${config_default.port}`);
    });
  } catch (error) {
    console.error("Failed to boot", error);
  }
}
bootstrap();
//# sourceMappingURL=server.js.map