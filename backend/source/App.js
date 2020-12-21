const express = require("express");
const expressSwagger = require("express-swagger-generator");
const swagger = require("express-swagger-generator/lib/swagger");
const db = require("./database");
const circuitBreaker = require("./circuitBreaker");
const dashboard = require("hystrix-dashboard");

var commandFactory = require("hystrixjs").commandFactory;
var metricsFactory = require("hystrixjs").metricsFactory;
var circuitFactory = require("hystrixjs").circuitFactory;

metricsFactory.resetCache();
circuitFactory.resetCache();
commandFactory.resetCache();

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      description: "This is a sample server",
      title: "Swagger",
      version: "1.0.0",
    },
    host: process.env.HOSTNAME || "localhost:" + process.env.PORT,
    basePath: "/api/v1",
    produces: ["application/json"],
    schemes: [process.env.SCHEMA],
    securityDefinitions: {
      JWT: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "",
      },
    },
  },
  basedir: __dirname, //app absolute path
  files: ["./routes/**/*.js"], //Path to the API handle folder
};

class App {
  constructor() {
    this.app = express();
    this.router = express.Router();
    this.server = null;

    this.app.use(express.json());
    this.app.use(this.router);

    // Route registration
    const apiPrefix = swaggerOptions.swaggerDefinition.basePath;
    require("./routes/products").register(apiPrefix, this.router);
    this.router.get("/hystrix.stream", circuitBreaker.hystrixStreamResponse);

    this.app.use(
      dashboard({
        idleTimeout: 4000, // will emit "ping if no data comes within 4 seconds,
        interval: 2000, // interval to collect metrics
        proxy: true, // enable proxy for stream
      })
    );

    this.app.use(App.errorHandler);

    expressSwagger(this.app)(swaggerOptions);
  }

  static errorHandler(err, req, res, next) {
    res.status(500).json({ status: false, msg: err });
  }

  run(done) {
    process.on("SIGINT", () => {
      this.stop(() => console.log("[SERVER] Shut down requested by user"));
    });

    db.setupConnection(() => {
      this.server = this.app.listen(process.env.PORT, () => {
        console.log(`[SERVER] Running at port ${process.env.PORT}`);
        done();
      });
    });
  }

  stop(done) {
    if (this.server == null) return;
    this.server.close(() => {
      db.closeConnection(done);
    });
  }
}

module.exports = App;
