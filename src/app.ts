import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:5173",
      "http://localhost:3000", // Common React dev port
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

app.use(
  express.json({
    limit: "50mb", // Maximum request body size - increased for image data.
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb", // Increased for image data
  })
);

app.use(express.static("public"));

app.use(cookieParser());

// ROUTES IMPORT
import authRouter from './routes/auth.route.js'
import analysisRouter from './routes/analysis.route.js'
import { errorHandler } from './middlewares/errorHandler.middleware.js';

// ROUTES DECLARATION
app.use("/api/auth", authRouter)
app.use("/api/analysis", analysisRouter)

// Global error handling middleware (must be last)
app.use(errorHandler);

export { app };