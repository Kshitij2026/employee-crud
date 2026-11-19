import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import employeeRoutes from "./routes/employees.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
// Browser requests are same-origin through the frontend Nginx reverse proxy.
// No permissive CORS policy is needed for this deployment pattern.
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "employee-api" }));
app.use("/api/employees", employeeRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: "An employee with this email already exists." });
  if (err.name === "ValidationError" || err.name === "CastError") return res.status(400).json({ message: err.message });
  res.status(500).json({ message: err.message || "Internal server error." });
});

const port = process.env.PORT || 5000;
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  app.listen(port, "0.0.0.0", () => console.log(`API listening on ${port}`));
} catch (err) {
  console.error("Startup failed:", err);
  process.exit(1);
}
