const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); // For hashing passwords
const EmployeeModel = require("./model/Employee");
const AssetModel = require("./model/Asset");
const AssignmentModel = require("./model/Assignment");
const OrderModel = require('./model/Order'); 
const ReportModel = require('./model/Report'); 
const DepartmentModel = require("./model/Department");
const CategoryModel = require("./model/Category");
const TransferHistory = require('./model/TransferHistory');


const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(
  "mongodb+srv://yeabsiraayalew6:yabu2020@stock.mpjql.mongodb.net/",
   
);
const validatePassword = (password) => {
  // Check password length
  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }

  // Check password complexity: at least one letter and one number
  const complexityRe = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  if (!complexityRe.test(password)) {
    return "Password must contain at least one letter and one number";
  }

  return null;
};


app.post("/", async (req, res) => {
  const { name, password } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const user = await EmployeeModel.findOne({ name: name});

    if (!user) {
      return res
        .status(404)
        .json({ message: "No record found with this name" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json(["good", user]);
    } else {
      res.status(401).json({ message: "Incorrect password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred during login" });
  }
});
app.post("/adduser", async (req, res) => {
  const { role, name, phone, password, address } = req.body;

  if (!["user", "Admin", "Clerk", "asset approver"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    const existingUser = await EmployeeModel.findOne
    ({name: name });
    if (existingUser) {
      return res.status(400).json({ error: "User is already registered with this name " });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new EmployeeModel({
      role,
      name,
      phone,
      password: hashedPassword,
      address,
    });

    const savedUser = await newUser.save();
    res.json(savedUser);
  } catch (err) {
    console.error("Error adding user:", err); // Log the detailed error
    if (err.code === 11000) {
      res.status(400).json({ error: "Duplicate phone" });
    } else {
      res.status(500).json({ error: "Error adding user" });
    }
  }
});


// app.get("/users", (req, res) => {
//   EmployeeModel.find({})
//     .then((users) => res.json(users))
//     .catch((err) => res.status(500).json({ message: "Error fetching users" }));
// });
app.get("/users", (req, res) => {
  const { search } = req.query;
  const searchRegex = new RegExp(search, "i"); // Case-insensitive search

  EmployeeModel.find({
    $or: [
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } }
    ]
  })
    .then((users) => res.json(users))
    .catch((err) => res.status(500).json({ message: "Error fetching users" }));
});

// Delete user endpoint
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  EmployeeModel.findByIdAndDelete(id)
    .then((deletedUser) => {
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    })
    .catch((err) =>
      res
        .status(500)
        .json({ message: "Error deleting user", error: err.message })
    );
});
// Update user endpoint
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { role, name, email, password, department } = req.body;

  // Prepare the update object
  const updateFields = { role, name, email, password, department };
  // Use the findByIdAndUpdate method to update the document
  EmployeeModel.findByIdAndUpdate(id, updateFields, { new: true })
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    })
    .catch((err) => {
      if (err.code === 11000) {
        // Handle duplicate key error
        res.status(400).json({ error: "Duplicate id or email" });
      } else {
        res
          .status(500)
          .json({ message: "Error updating user", error: err.message });
      }
    });
});
// Route to register a category
app.post('/category', async (req, res) => {
  try {
    const { code, description, category } = req.body;

    // Create a new category document
    const newCategory = new CategoryModel({
      code,
      description,
      category
    });

    // Save the category to the database
    await newCategory.save();

    res.status(201).json({ message: 'Category registered successfully.' });
  } catch (error) {
    console.error('Error registering category:', error); // Log the error for debugging
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to fetch all categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await CategoryModel.find(); // Fetch all categories from the database
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/department', async (req, res) => {
  try {
    const { code, description, department } = req.body;

    // Create a new category document
    const newDepartment = new DepartmentModel({
      code,
      description,
      department
    });

    // Save the category to the database
    await newDepartment.save();

    res.status(201).json({ message: 'Department registered successfully.' });
  } catch (error) {
    console.error('Error registering department:', error); // Log the error for debugging
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/departments', async (req, res) => {
  try {
    const departments = await DepartmentModel.find(); // Fetch all categories from the database
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Endpoint to register multiple assets
// app.post('/registerassets', async (req, res) => {
//   try {
//     const assets = req.body; // This should be an array of asset objects

//     // Validate assets
//     if (!Array.isArray(assets) || assets.length === 0) {
//       return res.status(400).json({ error: 'Invalid data. Array of assets is required.' });
//     }

//     // Save each asset
//     const savedAssets = await Promise.all(assets.map(asset => {
//       if (!asset.name || !asset.assetno || !asset.category||!asset.price) {
//         throw new Error('Name, assetno,price and category are required.');
//       }
//       return new AssetModel(asset).save();
//     }));

//     res.status(200).json(savedAssets);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });
app.post('/registerproduct', async (req, res) => {
  console.log(req.body);
  try {
    const assets = req.body; // Array of asset objects

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: 'Invalid data. Array of assets is required.' });
    }

    const savedAssets = await Promise.all(assets.map(async asset => {
      if (!asset.name  || !asset.category || !asset.saleprice || !asset.purchaseprice) {
        throw new Error('Name, assetno, price, and category are required.');
      }

      // Convert prices to numbers for validation
      const purchasePrice = parseFloat(asset.purchaseprice);
      const salePrice = parseFloat(asset.saleprice);

      if (isNaN(purchasePrice) || isNaN(salePrice)) {
        throw new Error('Purchase price and sale price must be valid numbers.');
      }

      // Check if the category already exists in the database
      const categoryExists = await CategoryModel.findById(asset.category);
      if (!categoryExists) {
        throw new Error('Category not found.');
      }

      // Save the asset with the existing category
      return new AssetModel({
        ...asset,
        category: categoryExists._id // Ensure category reference is by its ID
      }).save();
    }));

    res.status(200).json(savedAssets);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//  Endpoint to get all assets
// app.get("/assets", async (req, res) => {
//   try {
//     const assets = await AssetModel.aggregate([
//       {
//         $group: {
//           _id: "$category", // Group by category
//           assets: { $push: "$$ROOT" } // Collect all assets into an array
//         }
//       }
//     ]);

//     res.json(assets);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching assets" });
//   }
// });

// Endpoint to get all assets, aggregated by assetno and category
app.get("/productlist", async (req, res) => {
  const search = req.query.search || "";

  try {
    const assets = await AssetModel.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { assetno: { $regex: search, $options: 'i' } }
          ]
        }
      },
      {
        $group: {
          _id: "$category", // Group by category only
          assets: {
            $push: {
              _id: "$_id",
              assetno: "$assetno",
              name: "$name",
              purchaseprice: "$purchaseprice",
              saleprice: "$saleprice",
              quantity: "$quantity",
              description: "$description",
              quantityType: "$quantityType",
              status: "$status"
            }
          }
        }
      }
    ]);

    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching assets" });
  }
});


// Update asset information
app.put("/updateasset/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      assetno,
      purchaseprice,
      saleprice,
      quantity,
      description,
      status,
      category // Ensure category is included if needed
    } = req.body;

    // Find and update the asset
    const updatedAsset = await AssetModel.findByIdAndUpdate(
      id,
      {
        name,
        assetno,
        purchaseprice,
        saleprice,
        quantity,
        description,
        status, // Update status based on quantity
        category // Include category in the update if needed
      },
      { new: true }
    );

    if (updatedAsset) {
      res.json(updatedAsset);
    } else {
      res.status(404).json({ message: "Asset not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating asset" });
  }
});

// DELETE asset by ID
app.delete('/deleteasset/:id', async (req, res) => {
  try {
    const assetId = req.params.id;

    // Check if the asset exists before deleting
    const asset = await AssetModel.findById(assetId);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Delete the asset
    await AssetModel.findByIdAndDelete(assetId);

    return res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// app.post("/giveasset", async (req, res) => {
//   const { assetId, userId } = req.body;

//   console.log(`Received assetId: ${assetId}, userId: ${userId}`); // Debugging: Log received IDs

//   if (!assetId || !userId) {
//     return res.status(400).json({ error: "Asset ID and User ID are required" });
//   }

//   try {
//     // Check if the assetId and userId are valid ObjectId strings
//     if (!mongoose.Types.ObjectId.isValid(assetId)) {
//       return res.status(400).json({ error: "Invalid Asset ID" });
//     }

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: "Invalid User ID" });
//     }

//     // Start a session
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     // Find the asset and user
//     const asset = await AssetModel.findById(assetId).session(session);
//     if (!asset) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "Asset not found" });
//     }

//     const user = await EmployeeModel.findById(userId).session(session);
//     if (!user) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Check if the asset is already assigned to the user
//     const existingAssignment = await AssignmentModel.findOne({
//       asset: assetId,
//       user: userId,
//     }).session(session);

//     if (existingAssignment) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ error: "Asset already assigned to this user" });
//     }

//     // Check asset quantity
//     if (asset.quantity <= 0) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ error: "Asset quantity is zero" });
//     }

//     // Decrement asset quantity and update status to "assigned"
//     asset.quantity -= 1;
//     asset.status = 'Assigned';  // Update status
//     await asset.save({ session });

//     const assignment = new AssignmentModel({
//       asset: assetId,
//       user: userId,
//       dateAssigned: new Date(),
//     });

//     await assignment.save({ session });

//     // Commit the transaction
//     await session.commitTransaction();
//     session.endSession();

//     res.json(assignment);
//   } catch (error) {
//     console.error("Error assigning asset:", error);
//     res.status(500).json({ error: "Error assigning asset", details: error.message });
//   }
// });
app.post("/sellproduct", async (req, res) => {
  const { assetId, quantity, totalPrice } = req.body;

  console.log(`Received assetId: ${assetId}, quantity: ${quantity}, totalPrice: ${totalPrice}`);

  if (!assetId || quantity <= 0 || totalPrice <= 0) {
    return res.status(400).json({ error: "Asset ID, quantity, and total price are required" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid Asset ID" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const asset = await AssetModel.findById(assetId).session(session);
    if (!asset) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Asset not found" });
    }

    if (asset.quantity < quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: "Insufficient stock",
        remainingStock: asset.quantity
      });
    }

    // Calculate cost price
    const costPrice = asset.purchaseprice * quantity;

    // Decrement asset quantity
    asset.quantity -= quantity;

    // Update asset status based on remaining quantity
    if (asset.quantity === 0) {
      asset.status = 'Out Of Stock';
    } else if (asset.quantity <= 5) {
      asset.status = 'Low Stock';
    } else {
      asset.status = 'Available';
    }

    await asset.save({ session });

    const assignment = new AssignmentModel({
      asset: assetId,
      quantity,
      totalPrice,
      costPrice, // store costPrice
      dateAssigned: new Date(),
    });

    await assignment.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send back both the assignment details and the updated asset status
    res.json({ assignment, status: asset.status });
  } catch (error) {
    console.error("Error assigning asset:", error);
    res.status(500).json({ error: "Error assigning asset", details: error.message });
  }
});


// Endpoint to get all assigned assets
app.get("/assigned-assets", async (req, res) => {
  try {
    const assignments = await AssignmentModel.find({})
      .populate('asset') // Populates the asset field with asset details
      .exec();

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching assigned assets" });
  }
});

// app.post('/orders', async (req, res) => {
//   try {
//     const { asset, quantity, totalPrice, userName } = req.body;

//     // Validate and process order here
//     const order = new OrderModel({
//       asset,
//       quantity,
//       totalPrice,
//       userName // Save userName or userID with the order
//     });

//     await order.save();
//     res.status(201).send('Order placed successfully');
//   } catch (error) {
//     res.status(500).send({ error: error.message });
//   }
// });
// Endpoint to create an order
app.post('/orders', async (req, res) => {
  const { asset, quantity, totalPrice, userId } = req.body; // Use userId instead of userName

  if (!asset || quantity <= 0 || totalPrice <= 0 || !userId) {
    return res.status(400).json({ error: "Asset ID, quantity, total price, and user ID are required" });
  }

  // Validate ObjectId for asset and userId
  if (!mongoose.Types.ObjectId.isValid(asset) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid Asset ID or User ID" });
  }

  try {
    const assetDoc = await AssetModel.findById(asset);
    if (!assetDoc) {
      return res.status(404).json({ error: "Product not found" });
    }

    const order = new OrderModel({
      asset,
      quantity,
      totalPrice,
      userId, // Store userId
      dateOrdered: new Date(),
      status: 'Pending' // Ensure status is set to "Pending" when order is created
    });

    await order.save();

    // Populate asset information
    const populatedOrder = await OrderModel.findById(order._id).populate('asset');

    res.json(populatedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Error creating order", details: error.message });
  }
});


// app.post('/orders', async (req, res) => {
//   const { asset, quantity, totalPrice, userId } = req.body;

//   console.log("Request Body:", req.body);

//   if (!asset || quantity <= 0 || totalPrice <= 0 || !userId) {
//     return res.status(400).json({ error: "Asset ID, quantity, total price, and user ID are required" });
//   }

//   if (!mongoose.Types.ObjectId.isValid(asset) || !mongoose.Types.ObjectId.isValid(userId)) {
//     return res.status(400).json({ error: "Invalid asset or user ID" });
//   }


//   try {
//     const assetDoc = await AssetModel.findById(asset);
//     if (!assetDoc) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     const userDoc = await EmployeeModel.findById(userId); // Check if user exists
//     if (!userDoc) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const order = new OrderModel({
//       asset,
//       user: userId,
//       quantity,
//       totalPrice,
//       dateOrdered: new Date()
//     });

//     await order.save();

//     const populatedOrder = await OrderModel.findById(order._id)
//       .populate('asset')
//       .populate('user'); // Populate user field

//     res.json(populatedOrder);
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).json({ error: "Error creating order", details: error.message });
//   }
// });


// app.get('/orders', async (req, res) => {
//   try {
//     const orders = await OrderModel.find({})
//       .populate('asset') // Populate the asset field with product details
//       .populate('user') // Populate the user field with user details
//       .exec();

//     res.json(orders);
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ message: "Error fetching orders" });
//   }
// });

// Endpoint to get all orders
app.get("/orders", (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  // Fetch orders belonging to the logged-in user
  OrderModel.find({ userId: userId })
    .populate('asset') // Populate asset details
    .populate('userId', 'name address phone') // Populate user details: name, address, and phone
    .then(orders => {
      res.json(orders);
    })
    .catch(err => {
      res.status(500).json({ error: "Error fetching orders", message: err.message });
    });
});


// Get all orders
// Get all orders with populated user data
app.get('/admin/orders', async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate({
        path: 'userId', // Populate the user field
        select: 'name address phone' // Select the fields you want to show in the admin panel
      })
      .populate('asset'); // Populate asset details

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Error fetching orders", details: error.message });
  }
});

// Confirm an order
app.patch('/admin/orders/:orderId/confirm', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Find and populate the order
    const order = await OrderModel.findById(orderId).populate('asset');
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the asset has enough stock
    if (order.asset.quantity < order.quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    // Decrease asset stock
    order.asset.quantity -= order.quantity;
    let status = 'Available';

    // Update asset status based on stock level
    if (order.asset.quantity <= 0) {
      status = 'Out Of Stock';
    } else if (order.asset.quantity < 5) {
      status = 'Low Stock';
    }
    
    // Update asset with new quantity and status
    order.asset.status = status;
    await order.asset.save();

    // Update order status to "Confirmed"
    order.status = 'Confirmed';
    await order.save();
    
    // Repopulate the order with user and asset data for the response
    const updatedOrder = await OrderModel.findById(order._id)
      .populate('userId asset');
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).json({ error: "Error confirming order", details: error.message });
  }
});


app.patch('/admin/orders/:orderId/reject', async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.orderId).populate('asset');
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If the order was previously confirmed, reverse the stock
    if (order.status === 'Confirmed') {
      order.asset.quantity += order.quantity;
      await order.asset.save(); // Save the updated stock
    }

    // Update the order status to "Rejected"
    order.status = 'Rejected';
    await order.save(); // Save the updated order status

    // Repopulate the user and asset data for the response
    const updatedOrder = await OrderModel.findById(order._id)
      .populate('userId asset');

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error rejecting order:", error);
    res.status(500).json({ error: "Error rejecting order", details: error.message });
  }
});

// app.patch('/admin/orders/:orderId/cancel', async (req, res) => {
//   try {
//     const order = await OrderModel.findById(req.params.orderId).populate('asset');
    
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // If the order was previously confirmed, reverse the stock
//     if (order.status === 'Confirmed') {
//       order.asset.stock += order.quantity;
//       await order.asset.save(); // Save the updated stock
//     }

//     // Update the order status to "Canceled"
//     order.status = 'Canceled';
//     await order.save(); // Save the updated order status

//     // Repopulate the user and asset data for the response
//     const updatedOrder = await OrderModel.findById(order._id)
//       .populate('userId asset');

//     res.json(updatedOrder);
//   } catch (error) {
//     console.error("Error canceling order:", error);
//     res.status(500).json({ error: "Error canceling order", details: error.message });
//   }
// });
app.post('/reports', async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Set end of day

  try {
    // Fetch assignments within the date range and populate 'asset' field
    const assignments = await AssignmentModel.find({
      dateAssigned: { $gte: start, $lte: end }
    }).populate('asset', 'name purchaseprice quantity status');

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'No sold products found for the given date range' });
    }

    const totalSales = assignments.reduce((sum, assignment) => sum + (assignment.totalPrice || 0), 0);
    const costPrice = assignments.reduce((sum, assignment) => sum + (assignment.asset?.purchaseprice || 0) * (assignment.quantity || 0), 0);
    const profitOrLoss = totalSales - costPrice;

    const reportData = assignments.map(assignment => ({
      assetName: assignment.asset.name,
      quantity: assignment.quantity,
      totalPrice: assignment.totalPrice,
      dateAssigned: assignment.dateAssigned,
      stockLevel: assignment.asset.quantity,
      status: assignment.asset.status
    }));

    console.log("Fetched assignments:", assignments);

    const report = new ReportModel({
      startDate,
      endDate,
      totalSales,
      profitOrLoss,
      reportData,
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Error generating report", details: error.message });
  }
});


// Endpoint to get all reports
app.get('/reports', async (req, res) => {
  try {
    const reports = await ReportModel.find().exec();

    console.log("Reports fetched:", reports);
    // Transform reports to remove mostSold and leastSold in the response
    const transformedReports = reports.map(report => ({
      ...report._doc,
      // Remove mostSold and leastSold from here
    }));

    res.json(transformedReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Error fetching reports", details: error.message });
  }
});




// Endpoint to transfer an asset from one user to another
app.post("/transferasset", async (req, res) => {
  const { assetId, fromUserId, toUserId } = req.body;
  
  if (!assetId || !fromUserId || !toUserId) {
    return res.status(400).json({ error: "Asset ID, from user ID, and to user ID are required" });
  }
try{
  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    return res.status(400).json({ error: "Invalid Asset ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(fromUserId)) {
    return res.status(400).json({ error: "Invalid User ID" });
  }
  if (!mongoose.Types.ObjectId.isValid(toUserId)) {
    return res.status(400).json({ error: "Invalid User ID" });
  }
    
    // Start a session
    const session = await mongoose.startSession();
    session.startTransaction();

   // Find the asset and user
   const asset = await AssetModel.findById(assetId).session(session);
   if (!asset) {
     await session.abortTransaction();
     session.endSession();
     return res.status(404).json({ error: "Asset not found" });
   }

   const fromUser = await EmployeeModel.findById(fromUserId).session(session);
   if (!fromUser) {
     await session.abortTransaction();
     session.endSession();
     return res.status(404).json({ error: "From User not found" });
   }
   const toUser = await EmployeeModel.findById(toUserId).session(session);
   if (!toUser) {
     await session.abortTransaction();
     session.endSession();
     return res.status(404).json({ error: "To User not found" });
   }

    // Find the current assignment
    const currentAssignment = await AssignmentModel.findOne({
      asset: assetId,
      user: fromUserId
    }).session(session);

    if (!currentAssignment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Current assignment not found" });
    }

    // Update the assignment to the new user
    currentAssignment.user = toUserId;
    await currentAssignment.save({ session });

    // Record the transfer in TransferHistory
    const transfer = new TransferHistory({
      asset: assetId,
      fromUser: fromUserId,
      toUser: toUserId,
      dateTransfered: new Date(),
    });
    await transfer.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json(transfer);
  } catch (error) {
    console.error("Error transferring asset:", error);
    res.status(500).json({ error: "Error transferring asset", details: error.message });
  }
});
// Define an endpoint to fetch transfer history
app.get("/transfer-history", async (req, res) => {
  try {
    const transferHistory = await TransferHistory.find({})
      .populate('asset') // Optional: populate the asset details
      .populate('fromUser') // Optional: populate the user details
      .populate('toUser'); // Optional: populate the user details
    res.json(transferHistory);
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    res.status(500).json({ error: "Error fetching transfer history" });
  }
});

// Update approval status endpoint
app.put('/approve-asset/:id', async (req, res) => {
  const { id } = req.params;
  const { Approved } = req.body; // `Approved` should be a boolean

  try {
    // Determine status based on the `Approved` value
    const status = Approved ? 'Approved' : 'Assigned';

    // Update the assignment
    const updatedAssignment = await AssignmentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedAssignment) {
      return res.status(404).send('Assignment not found');
    }
     // Optionally update the asset status here if required
     if (Approved) {
      await AssetModel.findByIdAndUpdate(
        updatedAssignment.asset,
        { status: 'Approved' }
      );
    }

    res.status(200).json(updatedAssignment);
  } catch (error) {
    res.status(500).send(`Error updating approval status: ${error.message}`);
  }
});
// Endpoint to get assigned assets for a specific user
app.get('/assigned-assets/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid User ID' });
  }

  try {
    const userAssignments = await AssignmentModel.find({ user: userId })
      .populate('asset')
      .exec();
     
      if (!userAssignments || userAssignments.length === 0) {
        return res.json([]); // Return empty array instead of message
      }

    res.json(userAssignments);
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Error fetching user assignments', details: error.message });
  }
});
// Endpoint to reset password
app.post("/resetpassword", async (req, res) => {
  const { name, newPassword } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const user = await EmployeeModel.findOne({ name: name }); // Searching by name now

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred while resetting the password." });
  }
});


app.post('/validate-security', async (req, res) => {
  const { name, securityQuestion, securityAnswer } = req.body;

  if (!name || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const user = await EmployeeModel.findOne({ name });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.securityQuestion !== securityQuestion || user.securityAnswer !== securityAnswer) {
      return res.status(400).json({ success: false, message: 'Security question or answer is incorrect.' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error validating security question:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route to get the security question for a user by email
app.get('/security-question', async (req, res) => {
  const { userId } = req.query; // Get the userId from query parameters

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const user = await EmployeeModel.findById(userId).select('securityQuestion securityAnswer');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      securityQuestion: user.securityQuestion || 'No current security question',
      securityAnswer: user.securityAnswer || ''
    });
  } catch (error) {
    console.error('Error fetching security question:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/update-security-question', async (req, res) => {
  const { userId, newSecurityQuestion, newSecurityAnswer } = req.body;

  try {
    const user = await EmployeeModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.securityQuestion = newSecurityQuestion;
    user.securityAnswer = newSecurityAnswer;
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating security question:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to reset the password
app.post('/reset-password', async (req, res) => {
  const { name, securityAnswer, newPassword } = req.body;

  if (!name || !securityAnswer || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await EmployeeModel.findOne({ name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.securityAnswer !== securityAnswer) {
      return res.status(400).json({ message: 'Security answer is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


app.listen(3001, () => {
  console.log("server is running");
});