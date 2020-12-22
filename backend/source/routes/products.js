const Product = require("../models/product");
const authorizeJWT = require("../middlewares/AuthorizeJWT");
const validators = require("../middlewares/validators");
const mongoose = require("mongoose");
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const Busboy = require('busboy');
AWS.config.update({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_KEY });
const S3 = new AWS.S3();

/**
 * @typedef format
 * @property {string}  name
 * @property {integer}     price
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
 * @property {string}  grind.required         - grind
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

/**
 * Get all products if empty, or selected product by _id wether providerId
 * @route GET /products
 * @group Products - Products
 * @param {string} productId.query -  If empty returns all prodcuts, or use providerId parameter
 * @param {string} providerId.query -  If empty returns all prodcuts,  or use productId parameter
 * @returns {ProductsProfile} 200 - Returns wheter selected product or all products
 * @returns {ProductsProfileError} default - unexpected error
 */
const getMethod = (req, res) => {
  console.log(Date() + "-GET /products");
  const productId = req.query.productId;
  const providerId = req.query.providerId;

  if (productId) {
    Product.findOne({ _id: productId }).exec(function (err, product) {
      if (product) {
        res.send(product);
      } else {
        res.sendStatus(404);
      }
    });
  } else if (providerId) {
    Product.find({ providerId: providerId }).exec(function (err, product) {
      if (product) {
        res.send(product);
      } else {
        res.sendStatus(404);
      }
    });
  } else {
    Product.find({}).exec(function (err, products) {
      res.send(products);
    });
  }
};

/**
 * Create a new products for a certain user
 * @route POST /products
 * @group Products - Products
 * @param {ProductsProfileAuth.model} product.body.required - New product
 * @returns {integer} 200 - Returns the  created product
 * @returns {ProductsProfileError} default - unexpected error
 */
const postMethod = (req, res) => {
  console.log(Date() + "-POST /products");
  delete req.body.product._id;
  req.body.product.providerId = mongoose.Types.ObjectId(
    req.body.product.providerId
  );

  Product.create(req.body.product, (err) => {
    if (err) {
      console.error(Date() + " - " + err);
      res.sendStatus(500);
    } else {
      res.status(201).json(req.body.product);
    }
  });
};

/**
 * Update an existing products
 * @route PUT /products
 * @group Products - Products
 * @param {string} productId.query.required -  Product Id
 * @param {ProductsProfileAuth.model} product.body.required - New value for the product
 * @returns {ProductsProfile} 200 - Returns the current state for this products
 * @returns {ProductsProfileError} default - unexpected error
 */
const putMethod = (req, res) => {
  console.log(Date() + "-PUT /products/id");
  delete req.body.product._id;

  Product.findOne({ _id: req.query.productId }).exec(function (err, product) {
    if (product) {
      Product.update(
        product,
        { $set: req.body.product },
        function (err, numReplaced) {
          if (numReplaced === 0) {
            console.error(Date() + " - " + err);
            res.sendStatus(404);
          } else {
            res.status(204).json(req.body.product);
          }
        }
      );
    } else {
      // If no document is found, product is null
      res.sendStatus(404);
    }
  });
};

/**
 * Deletes an existing product
 * @route DELETE /products
 * @group Products - Products
 * @param {string} productId.query.required -  Product Id
 * @param {userToken.model} userToken.body.required -  UserToken
 * @returns {ProductsProfile} 200 - Returns the current state for this products profile
 * @returns {ProductsProfileError} default - unexpected error
 */
const deleteMethod = (req, res) => {
  console.log(Date() + "-DELETE /products/id");
  Product.remove({ _id: req.query.productId }, {}, function (err, numRemoved) {
    if (numRemoved === 0) {
      console.error(Date() + " - " + err);
      res.sendStatus(404);
    } else {
      res.sendStatus(204);
    }
  });
};


/**
 * Upload a product image
 * @route POST /uploadImage
 * @group Products - Products
 * @param {file} imageName.formData.required -  Image
 * @returns {json} 200 - Info about the image location
 */
const uploadImageToS3 = (req, res) => {
  let chunks = [], fname, ftype, fEncoding;
  let busboy = new Busboy({ headers: req.headers });
  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
    fname = filename.replace(/ /g,"_");
    ftype = mimetype;
    fEncoding = encoding;
    file.on('data', function(data) {
        // you will get chunks here will pull all chunk to an array and later concat it.
        console.log (chunks.length);
        chunks.push(data)
    });
    file.on('end', function() {
        console.log('File [' + filename + '] Finished');
    });
  });
  busboy.on('finish', function() {
      const userId = uuidv4();
      const params = {
          Bucket: process.env.IMAGE_UPLOAD_BUCKET, // your s3 bucket name
          CreateBucketConfiguration: {
            // Set your region here
            LocationConstraint: process.env.REGION
          },
          Key: `${userId}-${fname}`, 
          Body: Buffer.concat(chunks), // concatinating all chunks
          ACL: 'public-read',
          ContentEncoding: fEncoding, // optional
          ContentType: ftype // required
      }
      // we are sending buffer data to s3.
      S3.upload(params, (err, s3res) => {
          if (err){
            res.send({err, status: 'error'});
          } else {
            res.send({data:s3res, status: 'success', msg: 'Image successfully uploaded.'});
          }
      });
      
  });
  req.pipe(busboy);
};

module.exports.register = (apiPrefix, router) => {
  router.get(apiPrefix + "/products", getMethod);
  router.post(
    apiPrefix + "/products",
    authorizeJWT,
    validators.validateProductData,
    postMethod
  );
  router.put(
    apiPrefix + "/products",
    authorizeJWT,
    validators.validateProductData,
    putMethod
  );
  router.delete(apiPrefix + "/products", authorizeJWT, deleteMethod);
  router.post(
    apiPrefix + "/uploadImage",
    uploadImageToS3
  );
};
