const mongoose = require("mongoose");

module.exports.setupConnection = (done) => {
  console.log(`[DB] Connecting to ${process.env.DBNAME}`);

  mongoose.connection.once("connected", () => {
    console.log("[DB] Connection Established");
    done();
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[DB] Connection Reestablished");
  });

  mongoose.connection.on("disconnected", () => {
    console.log("[DB] Connection Disconnected");
  });

  mongoose.connection.on("close", () => {
    console.log("[DB] Connection Closed");
  });

  mongoose.connection.on("error", (err) => {
    console.log(`[DB] Error happened: ${err}`);
  });

  // Create DB connection
  const uri = process.env.DBSTRING;
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
};

module.exports.closeConnection = (done) => {
  mongoose.connection.close((err) => {
    done();
  });
};
