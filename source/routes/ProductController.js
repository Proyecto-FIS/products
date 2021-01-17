const Product = require("../models/Product");
const authorizeJWT = require("../middlewares/AuthorizeJWT");
const Validators = require("../middlewares/validators");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const Busboy = require("busboy");
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});
const S3 = new AWS.S3();
const {
  stripeProductsCreate,
  stripePricesCreate,
  stripeProductsUpdate,
  stripePricesUpdate,
} = require("../stripeService");
const stripe = require("stripe");

class ProductController {
  /**
   * Get all products if empty, or selected product by _id wether providerId
   * @route GET /products
   * @group Products - Products
   * @param {string} productId.query -  If empty returns all prodcuts, or use providerId parameter
   * @param {string} providerId.query -  If empty returns all prodcuts,  or use productId parameter
   * @returns {ProductsProfile} 200 - Returns wheter selected product or all products
   * @returns {ProductsProfileError} default - unexpected error
   */
  getMethod(req, res) {
    console.log(Date() + "-GET /products");
    const productId = req.query.productId;
    const providerId = req.query.providerId;

    if (productId) {
      Product.findOne({ _id: productId, deleted: false }).exec(function (
        err,
        product
      ) {
        if (product) {
          res.send(product);
        } else {
          res.sendStatus(404);
        }
      });
    } else if (providerId) {
      Product.find({ providerId: providerId, deleted: false }).exec(function (
        err,
        product
      ) {
        if (product) {
          res.send(product);
        } else {
          res.sendStatus(404);
        }
      });
    } else {
      Product.find({ deleted: false }).exec(function (err, products) {
        res.send(products);
      });
    }
  }

  /**
   * Create a new products for a certain user
   * @route POST /products
   * @group Products - Products
   * @param {ProductsProfileAuth.model} product.body.required - New product
   * @returns {integer} 200 - Returns the  created product
   * @returns {ProductsProfileError} default - unexpected error
   */
  async postMethod(req, res) {
    console.log(Date() + "-POST /products");
    delete req.body.product._id;
    req.body.product.providerId = req.body.userID;
    req.body.product.deleted = false;

    // Create product in Stripe
    let product;
    try {
      product = await stripeProductsCreate.execute(this.stripeClient, {
        name: req.body.product.name,
      });

      req.body.product.stripe_id = product.id;
    } catch (err) {
      return res
        .status(503)
        .json({ reason: "Error creating product in Stripe" });
    }

    try {
      const pricePromises = req.body.product.format.map((format, i) => {
        return stripePricesCreate
          .execute(this.stripeClient, {
            unit_amount: format.price * 100, // In cents
            currency: "eur",
            recurring: { interval: "month" },
            product: product.id,
            nickname: format.name,
          })
          .then((price) => {
            req.body.product.format[i].stripe_id = price.id;
          });
      });

      // Create prices for new product
      await Promise.all(pricePromises);

      // Save product in database
      const doc = await new Product(req.body.product).save();
      return res.status(201).send(doc);
    } catch (err) {
      try {
        await stripeProductsUpdate.execute(
          this.stripeClient,
          req.body.product.stripe_id,
          { active: false }
        );
      } catch (err) {
        // Product fails to deactivate, we can't do more
        // Still unusable by the app cause there is no entry in the DB
        // Some manual deletion in Stripe dashboard must be made to delete junk data
      }
      return res.status(500).json(err);
    }
  }

  /**
   * Get products given an array of ids
   * @route GET /products-several
   * @group Products - Products
   * @param {string} identifiers.query -  id1, id2, id3, id4 ...
   * @returns {ProductsProfile} 200 - Returns wheter selected product or all products
   * @returns {ProductsProfileError} default - unexpected error
   */
  getMethodSeveral(req, res) {
    console.log(Date() + "-GET /products-several");
    const identifiers = req.query.identifiers.split(",");
    Product.find({ _id: { $in: identifiers }, deleted: false }).exec(function (
      err,
      products
    ) {
      res.send(products);
    });
  }

  /**
   * Update an existing products
   * @route PUT /products
   * @group Products - Products
   * @param {string} productId.query.required -  Product Id
   * @param {ProductsProfileAuth.model} product.body.required - New value for the product
   * @returns {ProductsProfile} 200 - Returns the current state for this product
   * @returns {ProductsProfileError} default - unexpected error
   */
  async putMethod(req, res) {
    console.log(Date() + "-PUT /products/id");

    // NOTE: This can cause inconsistencies between Stripe & DB product data if one
    // operation succeeds and the other fails, and viceversa
    // Lesson learned: store price data only in Stripe to avoid these inconsistencies
    // or add a Message Queue to ensure eventual data consistency
    // As there is not much time to perform a complete refactorization, we leave it as it is

    // Delete critical fields from the request
    delete req.body.product.providerId;
    delete req.body.product.stripe_id;
    if (req.body.product.hasOwnProperty("format")) {
      for (let i = 0; i < req.body.product.format.length; i++) {
        delete req.body.product.format[i].stripe_id;
      }
    }

    // Check user has access to product
    let oldProduct = await Product.findOne({
      _id: req.query.productId,
      providerId: req.body.userID,
    });
    if (!oldProduct) return res.sendStatus(401);
    req.body.product.stripe_id = oldProduct.stripe_id;

    // Update product name
    if (req.body.product.hasOwnProperty("name")) {
      try {
        await stripeProductsUpdate.execute(
          this.stripeClient,
          oldProduct.stripe_id,
          {
            name: req.body.product.name,
          }
        );
      } catch (err) {
        return res
          .status(503)
          .json({ reason: "Error updating product in Stripe" });
      }
    }

    // Update product prices
    if (req.body.product.hasOwnProperty("format")) {
      // Create new prices & update modified ones
      let pricePromises = req.body.product.format.map((format, i) => {
        const oldFormat = oldProduct.format.find(
          (oldfmt) => oldfmt.name === format.name
        );

        // Format not found, create new price
        if (!oldFormat) {
          return stripePricesCreate
            .execute(this.stripeClient, {
              unit_amount: format.price * 100, // In cents
              currency: "eur",
              recurring: { interval: "month" },
              product: oldProduct.stripe_id,
              nickname: format.name,
            })
            .then((price) => {
              req.body.product.format.find(
                (v) => v.name === price.nickname
              ).stripe_id = price.id;
            });
        } else {
          // Check if price changed and update if needed
          if (Math.abs(oldFormat.price - format.price) < Number.EPSILON) {
            req.body.product.format[i].stripe_id = oldFormat.stripe_id;
            return async () => {};
          } else {
            return stripePricesCreate
              .execute(this.stripeClient, {
                unit_amount: format.price * 100, // In cents
                currency: "eur",
                recurring: { interval: "month" },
                product: oldProduct.stripe_id,
                nickname: format.name,
                metadata: { replacedPrice: oldFormat.stripe_id },
              })
              .then((price) => {
                req.body.product.format.find(
                  (v) => v.name === price.nickname
                ).stripe_id = price.id;
                return stripePricesUpdate.execute(
                  this.stripeClient,
                  price.metadata.replacedPrice,
                  { active: false }
                );
              });
          }
        }
      });

      // Disable deleted prices
      oldProduct.format.forEach((format, i) => {
        const foundFormat = req.body.product.format.find(
          (fmt) => fmt.name === format.name
        );

        if (!foundFormat) {
          const pricePromise = stripePricesUpdate.execute(
            this.stripeClient,
            format.stripe_id,
            { active: false }
          );
          pricePromises.push(pricePromise);
        }
      });

      // Update prices in Stripe
      try {
        await Promise.all(pricePromises);
      } catch (err) {
        return res
          .status(503)
          .json({ reason: "Error updating prices in Stripe" });
      }
    }

    // Update product in database
    try {
      let doc = await Product.findOneAndUpdate(
        {
          _id: req.query.productId,
          providerId: req.body.userID,
        },
        req.body.product
      );
      doc = await Product.findById(doc._id);
      return res.status(200).json(doc);
    } catch (err) {
      return res.status(500).json(err);
    }
  }

  /**
   * Deletes an existing product
   * @route DELETE /products
   * @group Products - Products
   * @param {string} productId.query.required -  Product Id
   * @param {userToken.model} userToken.body.required -  UserToken
   * @returns {ProductsProfile} 200 - Returns the current state for this products profile
   * @returns {ProductsProfileError} default - unexpected error
   */
  async deleteMethod(req, res) {
    console.log(Date() + "-DELETE /products/id");
    // Delete product
    let doc;
    let filter = {
      _id: req.query.productId,
      providerId: req.body.userID,
      deleted: false,
    };
    try {
      doc = await Product.findOneAndUpdate(filter, { deleted: true });
      if (!doc) return res.sendStatus(401);
    } catch (err) {
      return res.status(500).json(err);
    }

    // Disable product in Stripe
    try {
      await stripeProductsUpdate.execute(this.stripeClient, doc.stripe_id, {
        active: false,
      });
    } catch (err) {
      // Not accesible by the app anyways, only helps with garbage data cleanup
    }
    const updated = await Product.findOne({ _id: req.query.productId });
    return res.status(200).json(updated);
  }

  /**
   * Upload a product image
   * @route POST /uploadImage
   * @group Products - Products
   * @param {file} imageName.formData.required -  Image
   * @returns {json} 200 - Info about the image location
   */
  uploadImageToS3(req, res) {
    let chunks = [],
      fname,
      ftype,
      fEncoding;
    let busboy = new Busboy({ headers: req.headers });
    busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
      console.log(
        "File [" +
          fieldname +
          "]: filename: " +
          filename +
          ", encoding: " +
          encoding +
          ", mimetype: " +
          mimetype
      );
      fname = filename.replace(/ /g, "_");
      ftype = mimetype;
      fEncoding = encoding;
      file.on("data", function (data) {
        // you will get chunks here will pull all chunk to an array and later concat it.
        console.log(chunks.length);
        chunks.push(data);
      });
      file.on("end", function () {
        console.log("File [" + filename + "] Finished");
      });
    });
    busboy.on("finish", function () {
      const userId = uuidv4();
      const params = {
        Bucket: process.env.IMAGE_UPLOAD_BUCKET, // your s3 bucket name
        CreateBucketConfiguration: {
          // Set your region here
          LocationConstraint: process.env.REGION,
        },
        Key: `${userId}-${fname}`,
        Body: Buffer.concat(chunks), // concatinating all chunks
        ACL: "public-read",
        ContentEncoding: fEncoding, // optional
        ContentType: ftype, // required
      };
      // we are sending buffer data to s3.
      S3.upload(params, (err, s3res) => {
        if (err) {
          res.send({ err, status: "error" });
        } else {
          res.send({
            data: s3res,
            status: "success",
            msg: "Image successfully uploaded.",
          });
        }
      });
    });
    req.pipe(busboy);
  }

  constructor(apiPrefix, router) {
    const route = `${apiPrefix}/products`;
    const userTokenValidators = [
      Validators.Required("userToken"),
      authorizeJWT,
    ];

    router.get(route + "-several", this.getMethodSeveral.bind(this));
    router.get(route, this.getMethod.bind(this));
    router.post(
      route,
      ...userTokenValidators,
      Validators.Required("product"),
      Validators.UniqueFormatName(),
      this.postMethod.bind(this)
    );
    router.put(
      route,
      ...userTokenValidators,
      Validators.Required("product"),
      Validators.UniqueFormatName(),
      this.putMethod.bind(this)
    );
    router.delete(route, ...userTokenValidators, this.deleteMethod.bind(this));
    router.post(apiPrefix + "/uploadImage", this.uploadImageToS3.bind(this));

    this.stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
  }
}

module.exports = ProductController;

/**
 * @typedef format
 * @property {string}  name
 * @property {integer}     price
 * @property {string}     stripe_id
 *
 */

/**
 * @typedef ProductsProfile
 * @property {string} _id - Unique identifier (ignored in POST requests due to id collision)
 * @property {string}  name.required          - Address
 * @property {string}  description.required   - City
 * @property {string}  providerId             - ProviderId
 * @property {integer}     stock.required         - Stock
 * @property {string}  imageUrl.required        - imgUrl
 * @property {string}  grind.required           - deleted
 * @property {boolean}  deleted.required         - grind
 * @property {Array.<format>} format.required
 */

/**
 * @typedef ProductsProfileAuth
 * @property {ProductsProfile.model} product - Products
 * @property {string} userToken.required - User Token
 */

/**
 * @typedef userToken
 * @property {string} userToken.required - User Token
 */

/**
 * @typedef ProductsProfileError
 * @property {string} todo.required - TODO
 */
