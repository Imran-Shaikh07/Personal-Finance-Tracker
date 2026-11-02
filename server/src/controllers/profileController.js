
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import fs from "node:fs/promises";
import path from "node:path";

function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.userId;
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto || "",
    currency: user.currency || "INR",
    createdAt: user.createdAt,
  };
}

async function removeOldPhoto(photoPath) {
  if (!photoPath || !photoPath.startsWith("/uploads/")) return;

  try {
    const filename = path.basename(photoPath);
    await fs.unlink(path.resolve("uploads", filename));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Could not remove old profile photo:", error.message);
    }
  }
}

// GET /api/profile
export async function getProfile(req, res) {
  try {
    const userId = getUserId(req);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ message: "Could not load profile." });
  }
}

// PUT /api/profile
export async function updateProfile(req, res) {
  try {
    const userId = getUserId(req);
    const { name, currency } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 ||
          name.trim().length > 80) {
        return res.status(400).json({
          message: "Name must contain 2 to 80 characters.",
        });
      }

      updates.name = name.trim();
    }

    if (currency !== undefined) {
      if (!["INR", "USD", "EUR", "GBP"].includes(currency)) {
        return res.status(400).json({
          message: "Unsupported currency.",
        });
      }

      updates.currency = currency;
    }

    if (req.file) {
      updates.profilePhoto = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide a name, currency, or profile photo to update.",
      });
    }

    const oldUser = await User.findById(userId);

    if (!oldUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const oldPhoto = oldUser.profilePhoto;

    Object.assign(oldUser, updates);
    await oldUser.save();

    if (req.file && oldPhoto && oldPhoto !== oldUser.profilePhoto) {
      await removeOldPhoto(oldPhoto);
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: publicUser(oldUser),
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "Could not update profile." });
  }
}

// PATCH /api/profile/password
export async function changePassword(req, res) {
  try {
    const userId = getUserId(req);
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      return res.status(400).json({
        message: "New password must be 8 to 72 characters.",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);

    if (!matches) {
      return res.status(400).json({
        message: "Your current password is incorrect.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "Your new password must be different.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully. Please sign in again.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({
      message: "Could not change password.",
    });
  }
}
