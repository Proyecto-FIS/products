const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set("useCreateIndex", true);
const uniqueArrayPlugin = require("mongoose-unique-array");

const ProductSchema = new Schema({
  name: { type: String, required: [true, "Product name required"] },
  stripe_id: { type: String, required: true },
  description: {
    type: String,
    minlength: [25, "Minimun description length 25 characters"],
  },
  stock: {
    type: Number,
    required: [true, "Stock required"],
    min: [0, "Minimun stock is zero"],
  },
  imageUrl: {
    type: String,
    required: [true, "An image link is mandatory"],
  },
  providerId: {
    type: Schema.Types.ObjectId,
    required: [true, "ProviderId required"],
  },
  grind: {
    type: [String],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "Invalid grind type",
    },
  },
  format: [
    {
      name: {
        type: String,
        required: [true, "Kind of format required"],
        unique: true,
      },
      price: {
        type: Number,
        required: [true, "Price required"],
        min: [0, "Minimun price is zero"],
      },
      stripe_id: { type: String, required: true }
    },
  ],
});
// Add the unique array plugin
ProductSchema.plugin(uniqueArrayPlugin);
//const M = mongoose.model("ProductSchema", ProductSchema);

module.exports = mongoose.model("Product", ProductSchema);
