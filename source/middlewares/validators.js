/**
 * @typedef ValidationError
 * @property {string} reason   - User-friendly reason message
 */
class Validators {
  static UniqueFormatName() {
    return (req, res, next) => {
      if(!req.body.product.hasOwnProperty("format")){
        next();
        return
      }
      const formatsNames = req.body.product.format.map((f) => f.name)
      if(new Set(formatsNames).size !== formatsNames.length){
        res.status(500).json({ reason: "Format names must be uniques" });
      }else{
        next();
      }
    }
  }

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
