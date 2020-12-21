/**
 * @typedef ValidationError
 * @property {string} reason   - User-friendly reason message
 */

class Validators {
  static validateProductData(req, res, next) {
    if (Validators.isEmpty(req.body.product.name)) {
      res.status(400).json({ reason: "Bad request, name empty" });
    } else {
      next();
    }
  }

  static isEmpty(string) {
    if (string.trim() === "") return true;
    else return false;
  }
}

module.exports = Validators;
