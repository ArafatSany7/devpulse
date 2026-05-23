import express, { type Application } from "express";
import cors from "cors";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { AuthRoutes } from "./modules/auth/auth.routes";
import { IssueRoutes } from "./modules/issues/issues.routes";

const app: Application = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", AuthRoutes);
app.use("/api/issues", IssueRoutes);
app.use(notFound);
app.use(globalErrorHandler);

export default app;
