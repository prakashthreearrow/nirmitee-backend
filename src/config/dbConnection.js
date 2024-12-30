const mongoose = require("mongoose");
const logger = require("../logger/logger");
config = require("./config").getConfig();

const connect = () => {
  const url = config.MONGO_CONNECTION_STRING;
  logger.info(
    "process.env.MONGO_CONNECTION_STRING :::" +
      process.env.MONGO_CONNECTION_STRING
  );

  const pemFilePath = process.env.PEM_FILE_PATH;

  const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // tls: true,
    // sslValidate: false,
  };

  mongoose.connect(url, mongooseOptions);

  mongoose.connection.once("open", async () => {
    logger.info("Connected to database");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("Error connecting to database  ", err);
  });
};

const disconnect = () => {
  if (!mongoose.connection) {
    return;
  }

  mongoose.disconnect();

  mongoose.once("close", async () => {
    console.log("Diconnected  to database");
  });
};

module.exports = {
  connect,
  disconnect,
};
