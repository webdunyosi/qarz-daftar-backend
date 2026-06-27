const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    time: {
      type: String, // String representation format (e.g. HH:MM)
      required: true,
    },
    type: {
      type: String, // "add", "edit", "delete", "pay", "broadcast", "info"
      required: true,
    },
    seller: {
      type: String, // Username or null for broadcast
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", LogSchema);
