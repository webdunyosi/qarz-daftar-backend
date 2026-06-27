const express = require("express");
const router = express.Router();
const Debt = require("../models/Debt");
const { authMiddleware } = require("../middleware/auth");

// @route   GET /api/debts
// @desc    Get debts (Admin gets all, Seller gets their own)
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query = {};

    // Filter by seller role
    if (req.user.role !== "admin") {
      query.seller = req.user.username;
    }

    // Apply search filter (if search term is provided)
    const { search, status, sana } = req.query;

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { mijozIsmi: searchRegex },
        { telefon: searchRegex },
        { mahsulot: searchRegex },
      ];
    }

    // Apply status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Apply date filter
    if (sana) {
      query.sana = sana;
    }

    const debts = await Debt.find(query).sort({ createdAt: -1 });
    res.json(debts);
  } catch (error) {
    console.error("Fetch debts error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   POST /api/debts
// @desc    Create a new debt
router.post("/", authMiddleware, async (req, res) => {
  const { mijozIsmi, telefon, mahsulot, qarzMiqdori, sana, tolashMuddati } = req.body;

  try {
    if (!mijozIsmi || !telefon || !mahsulot || qarzMiqdori === undefined || !sana || !tolashMuddati) {
      return res.status(400).json({ message: "Iltimos, barcha maydonlarni to'ldiring!" });
    }

    const newDebt = new Debt({
      mijozIsmi: mijozIsmi.trim(),
      telefon: telefon.trim(),
      mahsulot: mahsulot.trim(),
      qarzMiqdori: Number(qarzMiqdori),
      sana,
      tolashMuddati,
      status: "To'lanmagan",
      seller: req.user.username, // Automatically associate with current logged-in seller
    });

    await newDebt.save();
    res.status(201).json(newDebt);
  } catch (error) {
    console.error("Create debt error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   PUT /api/debts/:id
// @desc    Update a debt (details or status)
router.put("/:id", authMiddleware, async (req, res) => {
  const { mijozIsmi, telefon, mahsulot, qarzMiqdori, sana, tolashMuddati, status } = req.body;
  const { id } = req.params;

  try {
    const debt = await Debt.findById(id);
    if (!debt) {
      return res.status(404).json({ message: "Qarz topilmadi!" });
    }

    // Access check: Seller can only edit their own debts
    if (req.user.role !== "admin" && debt.seller !== req.user.username) {
      return res.status(403).json({ message: "Sizda ushbu qarzni tahrirlash huquqi yo'q!" });
    }

    if (mijozIsmi) debt.mijozIsmi = mijozIsmi.trim();
    if (telefon) debt.telefon = telefon.trim();
    if (mahsulot) debt.mahsulot = mahsulot.trim();
    if (qarzMiqdori !== undefined) debt.qarzMiqdori = Number(qarzMiqdori);
    if (sana) debt.sana = sana;
    if (tolashMuddati) debt.tolashMuddati = tolashMuddati;
    if (status) debt.status = status;

    await debt.save();
    res.json(debt);
  } catch (error) {
    console.error("Update debt error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

// @route   DELETE /api/debts/:id
// @desc    Delete a debt
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const debt = await Debt.findById(id);
    if (!debt) {
      return res.status(404).json({ message: "Qarz topilmadi!" });
    }

    // Access check: Seller can only delete their own debts
    if (req.user.role !== "admin" && debt.seller !== req.user.username) {
      return res.status(403).json({ message: "Sizda ushbu qarzni o'chirish huquqi yo'q!" });
    }

    await Debt.deleteOne({ _id: id });
    res.json({ message: "Qarz muvaffaqiyatli o'chirildi!" });
  } catch (error) {
    console.error("Delete debt error:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi!" });
  }
});

module.exports = router;
