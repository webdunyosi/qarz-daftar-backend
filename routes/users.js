const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Debt = require("../models/Debt");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// @route   GET /api/users
// @desc    Get all users list (Admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   POST /api/users
// @desc    Add a new seller (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { username, password, type } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Login va parolni kiriting!" });
    }

    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, "i") },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Bunday nomli sotuvchi allaqachon mavjud!" });
    }

    const newUser = new User({
      username: username.trim(),
      password: password.trim(),
      role: "seller",
      type: type || "",
    });

    await newUser.save();

    // Return the created user (without password)
    const userResponse = await User.findById(newUser._id).select("-password");
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   PUT /api/users/profile
// @desc    Update admin's own credentials (Admin only)
router.put("/profile", authMiddleware, adminMiddleware, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi!" });
    }

    if (username) {
      // Check if username is taken by another user
      const duplicate = await User.findOne({
        username: { $regex: new RegExp(`^${username.trim()}$`, "i") },
        _id: { $ne: req.user.id }
      });
      if (duplicate) {
        return res.status(400).json({ message: "Ushbu login band!" });
      }
      
      // Update associated debts with the new username if it changed
      if (user.username !== username.trim()) {
        await Debt.updateMany({ seller: user.username }, { seller: username.trim() });
      }
      
      user.username = username.trim();
    }

    if (password) {
      user.password = password; // pre-save hook hashes this
    }

    await user.save();
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      type: user.type
    });
  } catch (error) {
    console.error("Update admin profile error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   PUT /api/users/:identifier
// @desc    Update user details (Admin only)
router.put("/:identifier", authMiddleware, adminMiddleware, async (req, res) => {
  const { username, password, type } = req.body;
  const { identifier } = req.params;

  try {
    let user;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ username: identifier });
    }

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi!" });
    }

    if (username) {
      // Check duplication
      const duplicate = await User.findOne({
        username: { $regex: new RegExp(`^${username.trim()}$`, "i") },
        _id: { $ne: user._id },
      });

      if (duplicate) {
        return res.status(400).json({ message: "Ushbu login band!" });
      }

      // Update associated debts with the new username if it changed
      if (user.username !== username.trim()) {
        await Debt.updateMany({ seller: user.username }, { seller: username.trim() });
      }

      user.username = username.trim();
    }

    if (password) {
      user.password = password; // pre-save hook will hash it
    }

    if (type !== undefined) {
      user.type = type;
    }

    await user.save();

    const userResponse = await User.findById(user._id).select("-password");
    res.json(userResponse);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   DELETE /api/users/:identifier
// @desc    Delete user by username or ID (Admin only)
router.delete("/:identifier", authMiddleware, adminMiddleware, async (req, res) => {
  const { identifier } = req.params;

  try {
    let user;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ username: identifier });
    }

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi!" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin hisobini o'chirib bo'lmaydi!" });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: "Foydalanuvchi muvaffaqiyatli o'chirildi!" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

module.exports = router;
