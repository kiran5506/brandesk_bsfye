const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employeeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Name is required"],
    },
    employeeId: {
      type: String,
      required: false,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      trim: true,
      unique: [true, "Email should be unique"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      trim: true,
      select: false,
    },
    roles: {
      type: [String],
      enum: ["leads manager", "approval manager", "feedback manager", "hr manager", "site manager"],
      default: ["leads manager"],
    },
    mobileNumber: {
      type: String,
      required: false,
    },
    alternateMobileNumber: {
      type: String,
      required: false,
    },
    passPhoto: {
      type: String,
      required: false,
    },
    aadharFront: {
      type: String,
      required: false,
    },
    aadharBack: {
      type: String,
      required: false,
    },
    pan: {
      type: String,
      required: false,
    },
    rationCardFront: {
      type: String,
      required: false,
    },
    higherEducation: {
      type: String,
      required: false,
    },
    resume: {
      type: String,
      required: false,
    },
    presentAddress: {
      type: String,
      required: false,
    },
    permanentAddress: {
      type: String,
      required: false,
    },
    fatherHusbandWifeName: {
      type: String,
      required: false,
    },
    fatherHusbandWifeMobileNumber: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
