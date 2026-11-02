
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters."],
      maxlength: [80, "Name cannot exceed 80 characters."],
      match: [
        /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
        "Name can contain letters and spaces only. Apostrophes and hyphens are allowed.",
      ],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email address is too long."],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Enter a valid email address.",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      select: false,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
