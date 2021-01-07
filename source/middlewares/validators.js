/**
 * @typedef ValidationError
 * @property {string} reason   - User-friendly reason message
 */

class Validators {
  static Required(fieldName) {
    return (req, res, next) => {
      if (
        (req.body && req.body.hasOwnProperty(fieldName)) ||
        (req.query && req.query.hasOwnProperty(fieldName))
      ) {
        next();
      } else {
        res.status(400).json({ reason: "Bad request, missing fields" });
      }
    };
  }
}

module.exports = Validators;
