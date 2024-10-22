const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }, // Add userId field
  dateOrdered: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' } // Status field for tracking order status (e.g., Confirmed, Rejected)
});




module.exports = mongoose.model('Order', OrderSchema);
