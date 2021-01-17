const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set("useCreateIndex", true);

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
  deleted: {
    type: Boolean,
    required: [true, "Logic delete required"],
    default: false,
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
      },
      price: {
        type: Number,
        required: [true, "Price required"],
        min: [0, "Minimun price is zero"],
      },
      stripe_id: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("Product", ProductSchema);
