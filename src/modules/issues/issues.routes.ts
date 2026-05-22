import { Router } from "express";
import { IssueControllers } from "./issues.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/",
  auth("contributor", "maintainer"),
  IssueControllers.createIssue,
);
router.get("/", IssueControllers.getAllIssues);

export const IssueRoutes = router;
