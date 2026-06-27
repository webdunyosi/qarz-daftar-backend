const mongoose = require("mongoose");

const DebtSchema = new mongoose.Schema(
  {
    mijozIsmi: {
      type: String,
      required: true,
      trim: true,
    },
    telefon: {
      type: String,
      required: true,
      trim: true,
    },
    mahsulot: {
      type: String,
      required: true,
      trim: true,
    },
    qarzMiqdori: {
      type: Number,
      required: true,
    },
    sana: {
      type: String, // String representation format (e.g. YYYY-MM-DD) for consistency with date inputs
      required: true,
    },
    tolashMuddati: {
      type: String, // String representation format (e.g. YYYY-MM-DD)
      required: true,
    },
    status: {
      type: String,
      enum: ["To'lanmagan", "To'langan"],
      default: "To'lanmagan",
    },
    seller: {
      type: String, // Seller username
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Debt", DebtSchema);
