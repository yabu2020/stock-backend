const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  role: { type: String, required: false },
  name: { type: String, required: true, unique:true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  address: { type: String, required: false },
  securityQuestion: { type: String },
  securityAnswer: { type: String},
});

const EmployeeModel = mongoose.model("Employee", EmployeeSchema);

module.exports = EmployeeModel;
