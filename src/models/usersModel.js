const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Name is required"],
    },
    userid: {
      type: String,
      required: false,
    },
    mobileNumber: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      trim: true,
      unique: [true, "Email Should be unique"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      trim: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    dob: {
      type: Date,
      required: false
    },
    plans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: false,}],
    currentPlan: {
      type: Schema.Types.ObjectId,
      ref: 'Package', 
      required: false,
    },
    refCode: {
      type: String,
      required: false,
    },
    profile: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    qualification: {
      type: String,
      required: false,
    },
    occupationOrJob: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    pincode: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    isPaymentdone: {
      type: Boolean,
      default: false,
    },
    isactive: {
      type: Boolean,
      default: false,
    },
    bankAccount: {
      type: String,
      default: false,
    },
    accountNumber: {
      type: String,
      default: false,
    },
    ifscCode: {
      type: String,
      default: false,
    },
    aadhar: {
      type: String,
      required: false,
    },
    pancard: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
