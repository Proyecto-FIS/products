const Validators = require("../../source/middlewares/validators");
const utils = require("../utils");

describe("Validators", () => {
  test("Required OK", () => {
    const { req, res, next } = utils.mockMiddlewareInput({
      body: {
        randomField: "randomField",
      },
    });

    const validator = Validators.Required("randomField");
    validator(req, res, next);

    expect(next.mock.calls.length).toBe(1);
    expect(res.status.mock.calls.length).toBe(0);
    expect(res.json.mock.calls.length).toBe(0);
  });

  test("Required missing field", () => {
    const { req, res, next } = utils.mockMiddlewareInput({
      body: {},
    });

    const validator = Validators.Required("randomField");
    validator(req, res, next);

    expect(next.mock.calls.length).toBe(0);
    expect(res.status.mock.calls.length).toBe(1);
    expect(res.json.mock.calls.length).toBe(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      reason: "Bad request, missing fields",
    });
  });
});
