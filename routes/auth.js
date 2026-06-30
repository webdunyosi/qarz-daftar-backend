const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Login va parolni kiriting!" });
    }

    // Find user by username (case-insensitive)
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username.trim()}$`, "i") } 
    });

    if (!user) {
      return res.status(400).json({ message: "Login yoki parol noto'g'ri!" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Login yoki parol noto'g'ri!" });
    }

    // Create JWT Token
    const payload = { id: user.id };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "qarz_daftar_super_secret_key_123!",
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        type: user.type,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      type: req.user.type,
      isBlocked: req.user.isBlocked,
      subscriptionUntil: req.user.subscriptionUntil,
      paymentStatus: req.user.paymentStatus,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

module.exports = router;
