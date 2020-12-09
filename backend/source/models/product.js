const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FormatSchema = new Schema({
    type: String,
    price: Number
});

const ProductSchema = new Schema({
    name: String,
    description: String,
    stock: Number,
    imageUrl: String,
    providerId: String,
    grind: Array,
    format: [FormatSchema]
});


module.exports = mongoose.model("Product", ProductSchema);