const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString("hex") + ext);
  },
});

const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    const err = new Error("Only images and PDF files are allowed");
    err.status = 400;
    cb(err);
  },
});

module.exports = { upload, uploadsDir };
