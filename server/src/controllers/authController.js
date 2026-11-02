
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function createToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
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

function validateName(name) {
  if (typeof name !== "string") {
    return "Full name is required.";
  }

  const cleanName = name.trim();

  if (cleanName.length < 2 || cleanName.length > 80) {
    return "Name must contain 2 to 80 characters.";
  }

  if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(cleanName)) {
    return "Name can contain letters and spaces only. Apostrophes and hyphens are allowed.";
  }

  return "";
}

function validateEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    return "Email address is required.";
  }

  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail.length > 254) {
    return "Email address is too long.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return "Enter a valid email address, such as name@example.com.";
  }

  return "";
}

function validatePassword(password) {
  if (typeof password !== "string" || !password) {
    return "Password is required.";
  }

  if (password.length < 8 || password.length > 72) {
    return "Password must be 8 to 72 characters.";
  }

  if (/\s/.test(password)) {
    return "Password cannot contain spaces.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return "Password must contain at least one special character.";
  }

  return "";
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { name, email, password } = req.body ?? {};

    const nameError = validateName(name);
    if (nameError) {
      return res.status(400).json({ message: nameError });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Server configuration error. Please try again later.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    const token = createToken(user._id);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to create account. Please try again.",
    });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const emailError = validateEmail(cleanEmail);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Server configuration error. Please try again later.",
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
}

// GET /api/auth/me
export async function getMe(req, res) {
  return res.json({
    user: publicUser(req.user),
  });
}
