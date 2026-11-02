
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

// Get the authenticated user's ID.
// Adjust this helper if your existing JWT middleware uses another property.
function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.userId;
}

// CREATE a transaction
export async function createTransaction(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { type, amount, category, description, date } = req.body;

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a number greater than zero",
      });
    }

    if (typeof category !== "string" || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (
      date !== undefined &&
      (Number.isNaN(Date.parse(date)) ||
        typeof date !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Date must be a valid date string",
      });
    }

    const transaction = await Transaction.create({
      user: userId,
      type,
      amount: Number(amount),
      category: category.trim(),
      description,
      ...(date ? { date: new Date(date) } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
}

// READ all transactions for the authenticated user
export async function getTransactions(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const transactions = await Transaction.find({ user: userId })
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
}

// UPDATE a transaction owned by the authenticated user
export async function updateTransaction(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const allowedFields = [
      "type",
      "amount",
      "category",
      "description",
      "date",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.type !== undefined &&
        !["income", "expense"].includes(updates.type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    if (updates.amount !== undefined) {
      const amount = Number(updates.amount);

      if (
        updates.amount === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than zero",
        });
      }

      updates.amount = amount;
    }

    if (updates.category !== undefined) {
      if (
        typeof updates.category !== "string" ||
        !updates.category.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty",
        });
      }

      updates.category = updates.category.trim();
    }

    if (updates.date !== undefined) {
      if (
        typeof updates.date !== "string" ||
        Number.isNaN(Date.parse(updates.date))
      ) {
        return res.status(400).json({
          success: false,
          message: "Date must be a valid date string",
        });
      }

      updates.date = new Date(updates.date);
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update transaction",
    });
  }
}

// DELETE a transaction owned by the authenticated user
export async function deleteTransaction(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
}
