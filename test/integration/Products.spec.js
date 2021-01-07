const DatabaseConnection = require("../../source/database");
const ProductController = require("../../source/routes/ProductController");
const mongoose = require("mongoose");
const utils = require("../utils");
const request = require("supertest");

describe("Products integration", () => {
  const testURL = "/products";
  const db = new DatabaseConnection();
  let app;

  // Preload data
  const users = [
    mongoose.Types.ObjectId(100).toHexString(),
    mongoose.Types.ObjectId(200).toHexString(),
  ];
  const preload = [
    {
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
    },
    {
      name: "testname2",
      description: "for coffee of mercadona enough description",
      stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1.2.1&auto",
      grind: ["Expresso"],
      format: [
        {
          name: "1kg",
          price: 48,
        },
      ],
    },
  ];

  beforeAll(() => {
    const controller = new ProductController(testURL, utils.mockedRouter());
    app = utils.createExpressApp(controller, testURL);
    return db.setup();
  });

  beforeEach((done) =>
    mongoose.connection.dropCollection("products", (err) => done())
  );

  afterAll(() => db.close());

  test("Should return empty", () => {
    return request(app).get(testURL).expect(200, []);
  });

  test("Missing required fields in write", () => {
    return request(app)
      .post(testURL)
      .send({
        product: { name: "name" },
        userID: mongoose.Types.ObjectId().toHexString(),
      })
      .expect(500);
  });

  test("Save porducts from different provider and filter by provider", () => {
    return request(app)
      .post(testURL)
      .send({
        product: { ...preload[0] },
        userID: users[0],
      })
      .expect(201)
      .then((response) => {
        console.log(response.body);
        expect(
          mongoose.Types.ObjectId.isValid(response.body.providerId)
        ).toBeTruthy();
        return request(app)
          .post(testURL)
          .send({
            product: { ...preload[1] },
            userID: users[1],
          })
          .expect(201);
      })
      .then((response) => {
        expect(
          mongoose.Types.ObjectId.isValid(response.body.providerId)
        ).toBeTruthy();
        return request(app)
          .get(testURL)
          .query({ providerId: users[0] })
          .expect(200);
      })
      .then((response) => {
        const data = response.body;
        expect(200);
        expect(data.length).toBe(1);
        expect(data[0].userID).toBeUndefined();
        expect(data[0]).toMatchObject(preload[0]);
      });
  });

  test("Update product", () => {
    const newName = "newName";

    return request(app)
      .post(testURL)
      .send({
        product: { ...preload[1] },
        userID: users[1],
      })
      .expect(201)
      .then((response) => {
        expect(
          mongoose.Types.ObjectId.isValid(response.body.providerId)
        ).toBeTruthy();
        return request(app)
          .put(testURL)
          .query({ productId: response.body._id })
          .send({
            product: {
              name: newName, // Updated field
            },
            userID: users[1],
          })
          .expect(200);
      })
      .then((response) => {
        expect(response.body.name).toBe(newName);
      });
  });

  test("Update foreign product", () => {
    return request(app)
      .post(testURL)
      .send({
        product: { ...preload[1] },
        userID: users[1],
      })
      .expect(201)
      .then((response) => {
        expect(
          mongoose.Types.ObjectId.isValid(response.body.providerId)
        ).toBeTruthy();
        return request(app)
          .put(testURL)
          .query({ productId: response.body._id })
          .send({
            product: {
              name: "infiltrator", // Updated field
            },
            userID: users[0],
          })
          .expect(401);
      });
  });

  test("Delete product", () => {
    return request(app)
      .post(testURL)
      .send({
        product: { ...preload[1] },
        userID: users[1],
      })
      .expect(201)
      .then((response) => {
        expect(
          mongoose.Types.ObjectId.isValid(response.body.providerId)
        ).toBeTruthy();
        return request(app)
          .delete(testURL)
          .query({ productId: response.body._id })
          .send({
            userID: users[1],
          })
          .expect(200);
      });
  });

  test("Delete foreign product", () => {
    return request(app)
      .post(testURL)
      .send({
        product: { ...preload[1] },
        userID: users[1],
      })
      .expect(201)
      .then((response) => {
        expect(
          mongoose.Types.ObjectId.isValid(response.body.providerId)
        ).toBeTruthy();
        return request(app)
          .delete(testURL)
          .query({ productId: response.body._id })
          .send({
            userID: users[0],
          })
          .expect(401);
      });
  });
});
