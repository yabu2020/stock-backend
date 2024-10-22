const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalSales: {
    type: Number,
    required: true
  },
  profitOrLoss: {
    type: Number,
    required: true
  },
  reportData: [
    {
      asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
      name:String,
      quantity: Number,
      totalPrice: Number,
      dateAssigned: Date,
      stockLevel: Number, // Already added stock level
      status: {
        type: String,
        enum: ['Available', 'Low Stock', 'Out Of Stock'],
      },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
