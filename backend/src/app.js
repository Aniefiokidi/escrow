import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import disputeRoutes from "./routes/disputeRoutes.js";
import trustRoutes from "./routes/trustRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "escrow-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/trust", trustRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
