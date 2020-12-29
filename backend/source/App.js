const express = require("express");
const swagger = require("./swagger");
const db = require("./database");
const circuitBreaker = require("./circuitBreaker");

class App {
  constructor() {
    this.app = express();
    this.router = express.Router();
    this.server = null;
    this.port = process.env.PORT || 8080;

    this.app.use(express.json());
    this.app.use(this.router);

    // Route registration
    const apiPrefix = swagger.getBasePath();
    require("./routes/products").register(apiPrefix, this.router);

    circuitBreaker.initHystrixStream(this.router);

    this.app.use(App.errorHandler);

    swagger.setUpSwagger(this.app, this.port);
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
