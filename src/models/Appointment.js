const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      maxLength: 100,
    },
    title: {
      type: String,
      maxLength: 100,
    },
    date: {
      type: Date,
    },
    startTime: {
      type: String,
      maxLength: 100,
    },
    endTime: {
      type: String,
      maxLength: 100,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("Appointment", taskSchema);
