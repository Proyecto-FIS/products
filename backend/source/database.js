const DataStore = require("nedb");

const DB_FILE_NAME = __dirname + "/products.json";

const db = new DataStore({
  filename: DB_FILE_NAME,
  autoload: true,
});

module.exports.db = db;
