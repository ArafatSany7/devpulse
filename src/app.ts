import express, { type Application } from "express";
import cors from "cors";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { AuthRoutes } from "./modules/auth/auth.routes";

const app: Application = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", AuthRoutes);
app.use(notFound);
app.use(globalErrorHandler);

// app.get("/api/check", (req, res) => {
//   res.status(200).json({ success: true, message: "Server is running" });
// });

export default app;
