require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const SellerType = require("./models/SellerType");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/debts", require("./routes/debts"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/seller-types", require("./routes/sellerTypes"));

// Base route
app.get("/", (req, res) => {
  res.send("Qarz Daftar API is running...");
});

// Database Connection & Seed Data Function
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qarz-daftar";

const seedData = async () => {
  try {
    // Seed default users if none exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("Pre-seeding default users...");
      const admin = new User({
        username: "Admin",
        password: "Admin123*",
        role: "admin",
      });
      const marjona = new User({
        username: "Marjona",
        password: "Marjona123*",
        role: "seller",
        type: "Kiyim-kechak",
      });
      await admin.save();
      await marjona.save();
      console.log("Default users (Admin and Marjona) seeded successfully.");
    }

    // Seed default seller types if none exist
    const typeCount = await SellerType.countDocuments();
    if (typeCount === 0) {
      console.log("Pre-seeding default seller types...");
      const defaultTypes = [
        "Kiyim-kechak",
        "Oziq-ovqat",
        "Go'sht mahsulotlari (Tovuq)",
        "Maishiy texnika",
      ];
      for (const typeName of defaultTypes) {
        const newType = new SellerType({ name: typeName });
        await newType.save();
      }
      console.log("Default seller types seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding initial data:", err);
  }
};

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Successfully connected to MongoDB.");
    await seedData();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
  });
