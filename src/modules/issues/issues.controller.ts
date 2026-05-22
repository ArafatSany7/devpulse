import pool from "../../database/index.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";

const createIssue = catchAsync(async (req, res) => {
  const { title, description, type } = req.body;
  const reporter_id = req.user!.id;

  const result = await pool.query(
    "INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, description, type, reporter_id],
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Issue created successfully",
    data: result.rows[0],
  });
});

const getAllIssues = catchAsync(async (req, res) => {
  const { sort = "newest", type, status } = req.query;

  let query = "SELECT * FROM issues WHERE 1=1";
  const values: any[] = [];
  let index = 1;

  if (type) {
    query += ` AND type = $${index++}`;
    values.push(type);
  }
  if (status) {
    query += ` AND status = $${index++}`;
    values.push(status);
  }

  query +=
    sort === "oldest"
      ? " ORDER BY created_at ASC"
      : " ORDER BY created_at DESC";

  const issueResult = await pool.query(query, values);
  const issues = issueResult.rows;

  if (issues.length === 0) {
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "No issues found",
      data: [],
    });
  }

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const usersResult = await pool.query(
    "SELECT id, name, role FROM users WHERE id = ANY($1)",
    [reporterIds],
  );
  const usersMap = new Map(usersResult.rows.map((user) => [user.id, user]));

  const formattedData = issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;
    return { ...issueData, reporter: usersMap.get(reporter_id) };
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Issue retryeved successfully",
    data: formattedData as any,
  });
});

const getSingleIssue = catchAsync(async (req, res) => {
  const { id } = req.params;

  const issueResult = await pool.query("SELECT * FROM issues WHERE id = $1", [
    id,
  ]);
  const issue = issueResult.rows[0];

  if (!issue) {
    throw Object.assign(new Error("Issue not found"), {
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  const userResult = await pool.query(
    "SELECT id, name, role FROM users WHERE id = $1",
    [issue.reporter_id],
  );

  const { reporter_id, ...issueData } = issue;

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Issue retryeved",
    data: { ...issueData, reporter: userResult.rows[0] } as any,
  });
});

export const IssueControllers = { createIssue, getAllIssues, getSingleIssue };
