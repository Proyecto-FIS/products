const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: { type: String, required: [true, "Product name required"] },
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
  providerId: Schema.Types.ObjectId,
  grind: { type: [String], enum: ["Expresso", "Filtro", "Grano"] },
  format: [
    {
      name: { type: String, required: [true, "Kind of format required"] },
      price: {
        type: Number,
        required: [true, "Price required"],
        min: [0, "Minimun price is zero"],
      },
    },
  ],
});

module.exports = mongoose.model("Product", ProductSchema);
