const express = require("express");
const { validateProductData } = require("../../utils/validators");
const Product = require("../models/product")

/**
 * @typedef format
 * @property {string}  type
 * @property {integer}     price
 *
 */

/**
 * @typedef ProductsProfile
 * @property {integer} _id           - UUID
 * @property {integer} _providerId   - Identifier
 * @property {string}  name          - Address
 * @property {string}  description   - City
 * @property {integer}     stock         - Stock
 * @property {string}  imgUrl        - imgUrl
 * @property {string}  grind         - imgUrl
 * @property {Array.<format>} formats
 */

/**
 * @typedef ProductsProfileError
 * @property {string} todo.required - TODO
 */

/**
 * Get all products if empty, or selected product by _id
 * @route GET /products
 * @group Products - Products
 * @param {string} productId.query -  If empty returns all prodcuts
 * @returns {ProductsProfile} 200 - Returns wheter selected product or all products
 * @returns {ProductsProfileError} default - unexpected error
 */
const getMethod = (req, res) => {
  console.log(Date() + "-GET /products");
  const productId = req.query.productId;

  if (productId) {
    Product.findOne({ _id: productId }).exec(function (err, product) {
      if (product) {
        res.send(product);
      } else {
        // If no document is found, product is null
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
 * @param {ProductsProfile.model} product.body.required - New product
 * @returns {integer} 200 - Returns the  created product
 * @returns {ProductsProfileError} default - unexpected error
 */
const postMethod = (req, res) => {
  console.log(Date() + "-POST /products");
  const newProduct = {
    name: req.body.name,
    description: req.body.description,
    stock: req.body.stock,
    imageUrl: "https://www.google.com",
    providerId: "UUID",
    grind: req.body.grind,
    format: req.body.format,
  };
  const { valid, errors } = validateProductData(newProduct);
  if (!valid) return res.status(400).json(errors);
  Product.create(newProduct, (err) => {
    if (err) {
      console.error(Date() + " - " + err);
      res.sendStatus(500);
    } else {
      res.status(201).json(newProduct);
    }
  });
};

/**
 * Update an existing products
 * @route PUT /products
 * @group Products - Products
 * @param {string} productId.query.required -  Product Id
 * @param {ProductsProfile.model} product.body.required - New value for the product
 * @returns {ProductsProfile} 200 - Returns the current state for this products
 * @returns {ProductsProfileError} default - unexpected error
 */
const putMethod = (req, res) => {
  console.log(Date() + "-PUT /products/id");
  const productId = req.query.productId;
  const newProduct = req.body;

  Product.findOne({ _id: productId }).exec(function (err, product) {
    if (product) {
      Product.update(
        product,
        { $set: newProduct },
        function (err, numReplaced) {
          if (numReplaced === 0) {
            console.error(Date() + " - " + err);
            res.sendStatus(404);
          } else {
            res.status(204).json(newProduct);
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
 * @returns {ProductsProfile} 200 - Returns the current state for this products profile
 * @returns {ProductsProfileError} default - unexpected error
 */
const deleteMethod = (req, res) => {
  console.log(Date() + "-DELETE /products/id");
  const productId = req.query.productId;
  Product.remove({ _id: productId }, {}, function (err, numRemoved) {
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
  router.post(apiPrefix + "/products", postMethod);
  router.put(apiPrefix + "/products", putMethod);
  router.delete(apiPrefix + "/products", deleteMethod);
};
