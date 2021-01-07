const utils = require("../utils");
const makeRequest = utils.makeRequest;
const mongoose = require("mongoose");
const { response } = require("express");
const { send } = require("process");

describe("Products API", () => {
  const testURL = "/api/v1/products";
  let userToken, userID;

  beforeAll(async () => {
    const user = await utils.authTestUser();
    userToken = user.userToken;
    userID = user.userID;
  });

  beforeEach((done) =>
    mongoose.connection.dropCollection("products", (err) => done())
  );

  test("Unauthorized in POST", () => {
    return makeRequest()
      .post(testURL)
      .query({
        userToken: "Wrongtoken123",
      })
      .expect(401, { reason: "Authentication failed" });
  });

  test("Unauthorized in PUT", () => {
    return makeRequest()
      .put(testURL)
      .query({
        userToken: "Wrongtoken123",
      })
      .expect(401, { reason: "Authentication failed" });
  });

  test("Unauthorized in DELETE", () => {
    return makeRequest()
      .delete(testURL)
      .query({
        userToken: "Wrongtoken123",
      })
      .expect(401, { reason: "Authentication failed" });
  });

  test("Missing product in POST", () => {
    return makeRequest()
      .post(testURL)
      .send(userToken)
      .expect(400, { reason: "Bad request, missing fields" });
  });

  test("Missing product in PUT", () => {
    return makeRequest()
      .put(testURL)
      .send(userToken)
      .expect(400, { reason: "Bad request, missing fields" });
  });

  test("Missing productID in DELETE", () => {
    return makeRequest()
      .delete(testURL)
      .send(userToken)
      .expect(400, { reason: "Bad request, missing fields" });
  });

  test("Correct CRUD", () => {
    const sampleProduct = {
      name: "testname",
      description: "enough description for coffee of mercadona",
      stock: 3,
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons.jpg",
      grind: ["Expresso", "Grano"],
      format: [
        {
          name: "250g",
          price: 25,
        },
      ],
    };

    const updatedName = "thisIsMyNewName";
    let productID;

    return makeRequest()
      .post(testURL)
      .send({ product: sampleProduct, userToken })
      .expect(201)
      .then((response) => {
        expect(
          mongoose.Types.ObjectId.isValid(response.body.providerId)
        ).toBeTruthy();
        productID = response.body._id;
        return makeRequest()
          .get(testURL)
          .query({ productId: productID })
          .expect(200);
      })
      .then((response) => {
        expect(response.body._id).toBe(productID);
        expect(response.body.imageUrl).toBe(sampleProduct.imageUrl);
        return makeRequest()
          .put(testURL)
          .query({ productId: productID })
          .send({
            product: {
              name: updatedName,
            },
            userToken: userToken,
          })
          .expect(200);
      })
      .then(() => {
        return makeRequest()
          .delete(testURL)
          .query({ productId: productID })
          .send({ userToken: userToken })
          .expect(200);
      })
      .then(() => {
        return makeRequest()
          .get(testURL)
          .query({ productId: productID })
          .expect(404);
      });
  });
});
