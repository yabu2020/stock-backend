const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset', // Reference to the Asset model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  costPrice: { 
    type: Number 
  },
  dateAssigned: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['Available', 'Low Stock', 'Out Of Stock'], // Only allow these values
  }
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
