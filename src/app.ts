import express, { type Application } from "express";
import cors from "cors";

const app: Application = express();
app.use(cors());
app.use(express.json());

app.get("/api/check", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

export default app;
