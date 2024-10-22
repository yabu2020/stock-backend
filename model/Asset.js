const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  purchaseprice: { type: String,required:true },
  saleprice: { type: String,required:true },
  quantity: { type: Number, default: 1 },
  description: { type: String },
  quantityType: {
    type: String,
    enum: ["whole", "pieces"],
    default: "whole",
  },
  status: {
    type: String,
    enum: ["Available","Low Stock"],
    default: "Available",
  },
  category: { type: String, required: true }, // Ensure correct field name
});

const AssetModel = mongoose.model("Asset", AssetSchema);

module.exports = AssetModel;
