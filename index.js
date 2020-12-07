const express = require("express");
const bodyParser = require("body-parser");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const port = process.env.PORT || 3000;
const BASE_API_PATH = "/api/v1";

const app = express();
app.use(bodyParser.json());

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

var contacts = [
  { name: "Peter", age: 12 },
  { name: "John", age: 33 },
];

console.log("Starting API server...");

app.get("/", (req, res) => {
  res.send("<html><body><h1>HOLA MUNDO</h1></body></html>");
});

//Routes
/**
 * @swagger
 * /api/v1/contacts:
 *  get:
 *    description: Use to request all constacs
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get(BASE_API_PATH + "/contacts", async (req, res) => {
  console.log(Date() + "-GET /contacts");
  res.send(contacts);
});

app.post(BASE_API_PATH + "/contacts", (req, res) => {
  console.log(Date() + "-POST /contacts");
  var contact = req.body;
  contacts.push(contact);
  res.sendStatus(201);
});

app.listen(port);

console.log("Server ready!");
