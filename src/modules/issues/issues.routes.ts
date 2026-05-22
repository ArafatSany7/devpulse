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
router.get("/:id", IssueControllers.getSingleIssue);
router.patch(
  "/:id",
  auth("contributor", "maintainer"),
  IssueControllers.updateIssue,
);
router.delete("/:id", auth("maintainer"), IssueControllers.deleteIssue);

export const IssueRoutes = router;
