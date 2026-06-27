const express = require("express");
const router = express.Router();
const SellerType = require("../models/SellerType");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// @route   GET /api/seller-types
// @desc    Get all seller types
router.get("/", authMiddleware, async (req, res) => {
  try {
    const types = await SellerType.find().sort({ name: 1 });
    // Return array of names to match the frontend array structure exactly
    res.json(types.map((t) => t.name));
  } catch (error) {
    console.error("Fetch seller types error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   POST /api/seller-types
// @desc    Add a new seller type (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { name } = req.body;

  try {
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tur nomi kiritilishi shart!" });
    }

    const trimmedName = name.trim();

    const existingType = await SellerType.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existingType) {
      return res.status(400).json({ message: "Bunday tur allaqachon mavjud!" });
    }

    const newType = new SellerType({ name: trimmedName });
    await newType.save();

    res.status(201).json({ success: true, name: newType.name });
  } catch (error) {
    console.error("Create seller type error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   DELETE /api/seller-types/:name
// @desc    Delete a seller type by name (Admin only)
router.delete("/:name", authMiddleware, adminMiddleware, async (req, res) => {
  const { name } = req.params;

  try {
    const type = await SellerType.findOne({ name });
    if (!type) {
      return res.status(404).json({ message: "Sotuvchi turi topilmadi!" });
    }

    await SellerType.deleteOne({ _id: type._id });
    res.json({ message: "Sotuvchi turi muvaffaqiyatli o'chirildi!" });
  } catch (error) {
    console.error("Delete seller type error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

module.exports = router;
