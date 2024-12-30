const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "../../.env" });
const { User } = require("../models");
const logger = require("../logger/logger");
config = require("../config/config").getConfig();
const { ACTIVE, ROLE } = require("../services/Constants");

const createDoctor = async () => {
  try {
    const url = config.MONGO_CONNECTION_STRING;
    logger.info(
      "process.env.MONGO_CONNECTION_STRING :::" +
      process.env.MONGO_CONNECTION_STRING
    );

    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,

    };

    mongoose.connect(url, mongooseOptions);

    mongoose.connection.once("open", async () => {
      logger.info("Connected to database");
      await User.deleteOne({ userName: process.env.DOCTOR_USERNAME });
      const hash = await bcrypt.hashSync(process.env.DOCTOR_PASSWORD, 10);
      await User.create({
        userName: process.env.DOCTOR_USERNAME,
        status: ACTIVE,
        role: ROLE.DOCTOR,
        password: hash,
        emailVerify: new Date(),
      });

      logger.info("doctor data has been created :::");
    });
  } catch (error) {
    logger.error("Error", error);
  }
};

createDoctor();
