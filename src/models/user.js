const mongoose = require("mongoose");

// User
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      maxLength: 100,
    },
    lastName: {
      type: String,
      maxLength: 100,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      maxLength: 100,
    },
    email: {
      type: String,
      maxLength: 100,
    },
    password: {
      type: String,
      required: true,
      maxLength: 100,
    },
    image: {
      type: String,
      maxLength: 100
    },
    role: {
      type: Number,
      enum: [1, 2],
      required: true,
      Comment: { user: 1, docter: 2 },
    },
    emailVerify: {
      type: "date",
      default: null,
      Comment: { date: "verified", null: "not verified" },
    },
    otp: {
      type: String,
    },
    codeExpiry: {
      type: "date",
    },
    token: {
      type: String,
    },
    status: {
      type: String,
      default: "0",
      enum: ["0", "1", "2"], //0-inactive, 1- active, 2- deleted
    }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
// User

const User = mongoose.model("User", userSchema);

module.exports = {
  User
};
