const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Sessiya muddati tugadi yoki yaroqsiz token!" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "qarz_daftar_super_secret_key_123!");
    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Foydalanuvchi topilmadi!" });
    }

    // Check block & subscription status for sellers
    if (user.role !== "admin") {
      if (user.isBlocked) {
        return res.status(403).json({ message: "Sizning hisobingiz bloklangan! Iltimos, administrator bilan bog'laning." });
      }
      if (user.paymentStatus === "unpaid") {
        return res.status(402).json({ message: "Oylik to'lov muddati tugadi! Iltimos, to'lovni amalga oshiring." });
      }
      if (user.subscriptionUntil && new Date(user.subscriptionUntil) < new Date()) {
        return res.status(402).json({ message: "Oylik to'lov muddati tugadi! Iltimos, to'lovni amalga oshiring." });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Ruxsat berilmagan yoki yaroqsiz token!" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Ushbu amalni bajarish uchun ruxsat yo'q (Faqat Admin)!" });
  }
};

module.exports = { authMiddleware, adminMiddleware };
