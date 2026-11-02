
import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { protect } from "../middleware/authMiddleware.js";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/profileController.js";

const router = express.Router();

const uploadDirectory = path.resolve("uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    const extensions = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    callback(
      null,
      `${crypto.randomUUID()}${extensions[file.mimetype]}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new Error("Upload a JPG, PNG, or WEBP image.")
      );
    }

    callback(null, true);
  },
});

router.use(protect);

router.get("/", getProfile);
router.put("/", upload.single("photo"), updateProfile);
router.patch("/password", changePassword);

export default router;
