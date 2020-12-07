// Requires
const express = require("express");
const bodyParser = require("body-parser");
const DataStore = require("nedb");
//Swager documentation
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
const BASE_API_PATH = "/api/v1";
const DB_FILE_NAME = __dirname + "/products.json";

// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      version: "1.0.0",
      title: "Coffaine products API",
      description: "All products resources of coffaine documented in swagger",
      contact: {
        name: "Coffaine",
      },
      servers: ["http://localhost:3000" + BASE_API_PATH],
    },
  },
  //Ruta donde haya endpoints ['.routes/*.js']
  apis: ["index.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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

//Routes
/**
 * @swagger
 * /api/v1/products:
 *  get:
 *    description: Use to request all products
 *    responses:
 *      '200':
 *        description: A successful response
 */
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
