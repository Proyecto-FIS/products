const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: String,
  description: String,
  stock: Number,
  imageUrl: String,
  providerId: Schema.Types.ObjectId,
  grind: Array,
  format: [
    {
      name: String,
      price: Number,
    },
  ],
});

module.exports = mongoose.model("Product", ProductSchema);
