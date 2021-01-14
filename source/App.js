const express = require("express");
const swagger = require("./swagger");
const DatabaseConnection = require("./database");
const circuitBreaker = require("./circuitBreaker");
const ProductsController = require("./routes/ProductController");

class App {
  constructor() {
    this.app = express();
    this.router = express.Router();
    this.server = null;
    this.port = process.env.PORT || 8080;
    this.db = new DatabaseConnection();

    this.app.use(express.json());
    this.app.use(this.router);

    // Route registration
    const apiPrefix = swagger.getBasePath();
    this.ProductsController = new ProductsController(apiPrefix, this.router);

    circuitBreaker.initHystrixStream(this.router);
    circuitBreaker.initHystrixDashboard(this.app);

    this.app.use(App.errorHandler);

    swagger.setUpSwagger(this.app, this.port);
  }

  static errorHandler(err, req, res, next) {
    res.status(500).json({ status: false, msg: err });
  }

  run() {
    return new Promise((resolve, reject) => {
      process.on("SIGINT", () => {
        this.stop(() => console.log("[SERVER] Shut down requested by user"));
      });

      this.db
        .setup()
        .then(() => {
          this.server = this.app.listen(process.env.PORT, () => {
            console.log(`[SERVER] Running at port ${process.env.PORT}`);
            resolve();
          });
        })
        .catch(reject);
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (this.server == null) {
        reject();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log("[SERVER] Closed succesfully");
          this.db.close().then(resolve).catch(reject);
        }
      });
    });
  }
}

module.exports = App;
