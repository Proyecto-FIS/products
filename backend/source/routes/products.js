const express = require("express");
const { validateProductData } = require("../middlewares/validators");
const Product = require("../models/product");
const circuitBreaker = require("../circuitBreaker").configure;
const authorizeJWT = require("../middlewares/AuthorizeJWT");
const validators = require("../middlewares/validators");

// var command = circuitBreaker({
//   url: "https://jsonplaceholder.typicode.com/todos/1",
//   name: "sample request",
//   timeout: 1000,
//   fallback: { err: "error example" },
// });

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
  // const cmd = command.build();

  // cmd
  //   .execute()
  //   .then((response) => res.status(200).json(response.data))
  //   .catch((err) => res.sendStatus(500));

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
};
