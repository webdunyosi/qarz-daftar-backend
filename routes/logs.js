const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const { authMiddleware } = require("../middleware/auth");

// @route   GET /api/logs
// @desc    Get activity logs (Admin gets all, Seller gets own and broadcasts)
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== "admin") {
      // Seller sees their own logs OR broadcast logs
      query.$or = [
        { seller: req.user.username },
        { seller: null },
      ];
    }

    const logs = await Log.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    console.error("Fetch logs error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   POST /api/logs
// @desc    Add a new log (Self or Broadcast)
router.post("/", authMiddleware, async (req, res) => {
  const { text, type, seller, imageUrl, videoUrl } = req.body;

  try {
    if (!text || !type) {
      return res.status(400).json({ message: "Log matni va turi talab qilinadi!" });
    }

    // Set seller
    let logSeller = req.user.username;
    if (req.user.role === "admin" && seller === null) {
      logSeller = null; // Broadcast notification from admin
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const newLog = new Log({
      text,
      time: timeStr,
      type,
      seller: logSeller,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    console.error("Create log error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   DELETE /api/logs
// @desc    Clear activity logs (Admin clears all, Seller clears own)
router.delete("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      // Admin clears all logs
      await Log.deleteMany({});
    } else {
      // Seller clears only their own logs
      await Log.deleteMany({ seller: req.user.username });
    }
    res.json({ message: "Jurnal muvaffaqiyatli tozalandi!" });
  } catch (error) {
    console.error("Clear logs error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

module.exports = router;
