const path = require("path");
const fs = require("fs");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectToDB = require("./config/connectToDB");

if (!process.env.JWT_KEY || !process.env.MONGO_DB) {
  console.error("Missing MONGO_DB or JWT_KEY in .env (copy .env.example to .env)");
  process.exit(1);
}

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());
app.use(cors());

app.get("/api/health", (req, res) => res.send({ success: true, message: "OK" }));

app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/doctor", require("./routes/doctorRoutes"));

// 404 for unknown API routes
app.use("/api", (req, res) =>
  res.status(404).send({ success: false, message: "Route not found" })
);

// Error handler (must be after routes)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send({
    success: false,
    message: err.message || "Something went wrong",
  });
});

connectToDB().then(() => {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});
