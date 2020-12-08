// Requires
const express = require("express");
const bodyParser = require("body-parser");
const DataStore = require("nedb");

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
const BASE_API_PATH = "/api/v1";
const DB_FILE_NAME = __dirname + "/products.json";

const expressSwagger = require("express-swagger-generator")(app);

let options = {
  swaggerDefinition: {
    info: {
      description: "Coffaine Products resources",
      title: "Coffaine Products",
      version: "1.0.0",
    },
    host: "localhost:3000",
    basePath: BASE_API_PATH,
    produces: ["application/json", "application/xml"],
    schemes: ["http", "https"],
    securityDefinitions: {
      JWT: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "",
      },
    },
  },
  //basedir: __dirname, //app absolute path
  files: ["index.js"], //Path to the API handle folder
};
expressSwagger(options);

console.log("Starting API server...");

const db = new DataStore({
  filename: DB_FILE_NAME,
  autoload: true,
});

app.get("/", (req, res) => {
  res.send(
    "<html><body><h1>Coffaine Products - With Github Actions</h1></body></html>"
  );
});

app.get(BASE_API_PATH + "/products", async (req, res) => {
  console.log(Date() + "-GET /products");
  db.find({}).exec(function (err, products) {
    res.send(products);
  });
});

app.post(BASE_API_PATH + "/products", (req, res) => {
  console.log(Date() + "-POST /products");
  var product = req.body;
  db.insert(product, (err) => {
    if (err) {
      console.error(Date() + " - " + err);
      res.send(500);
    } else {
      res.sendStatus(201);
    }
  });
});

app.listen(port);

console.log("Server ready!");
