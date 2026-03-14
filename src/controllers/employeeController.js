const Employee = require("../models/employeeModel");
const bcrypt = require("bcryptjs");
const baseUrl = process.env.BASE_URL;

// Create Employee
exports.create = async (req, res) => {
  const {
    name,
    employeeId,
    email,
    password,
    roles,
    mobileNumber,
    alternateMobileNumber,
    pan,
    presentAddress,
    permanentAddress,
    fatherHusbandWifeName,
    fatherHusbandWifeMobileNumber,
    isActive,
  } = req.body;

  const files = req.files || {};

  try {
    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res
        .status(400)
        .json({
          status: false,
          message: "Email already exists",
        });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Process file uploads
    const passPhoto = files.passPhoto ? files.passPhoto[0].filename : "";
    const aadharFront = files.aadharFront ? files.aadharFront[0].filename : "";
    const aadharBack = files.aadharBack ? files.aadharBack[0].filename : "";
    const pan = files.pan ? files.pan[0].filename : "";
    const rationCardFront = files.rationCardFront ? files.rationCardFront[0].filename : "";
    const higherEducation = files.higherEducation ? files.higherEducation[0].filename : "";
    const resume = files.resume ? files.resume[0].filename : "";

    const newEmployee = new Employee({
      name,
      employeeId,
      email,
      password: hashedPassword,
      roles: roles ? (Array.isArray(roles) ? roles : [roles]) : ["leads manager"],
      mobileNumber,
      alternateMobileNumber,
      passPhoto,
      aadharFront,
      aadharBack,
      pan,
      rationCardFront,
      higherEducation,
      resume,
      presentAddress,
      permanentAddress,
      fatherHusbandWifeName,
      fatherHusbandWifeMobileNumber,
      isActive: isActive !== undefined ? isActive : true,
    });

    const result = await newEmployee.save();
    res
      .status(201)
      .json({
        status: true,
        message: "Employee created successfully",
        data: result,
      });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`,
    });
  }
};

// Edit Employee
exports.edit = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    employeeId,
    email,
    password,
    roles,
    mobileNumber,
    alternateMobileNumber,
    pan,
    presentAddress,
    permanentAddress,
    fatherHusbandWifeName,
    fatherHusbandWifeMobileNumber,
    isActive,
  } = req.body;

  const files = req.files || {};

  try {
    const employee = await Employee.findOne({ _id: id });
    if (!employee) {
      return res
        .status(404)
        .json({
          status: false,
          message: "Employee not found",
        });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res
          .status(400)
          .json({
            status: false,
            message: "Email already exists",
          });
      }
    }

    // Prepare update object
    const updateData = {
      name,
      employeeId,
      email,
      roles: roles ? (Array.isArray(roles) ? roles : [roles]) : employee.roles,
      mobileNumber,
      alternateMobileNumber,
      pan,
      presentAddress,
      permanentAddress,
      fatherHusbandWifeName,
      fatherHusbandWifeMobileNumber,
      isActive: isActive !== undefined ? isActive : employee.isActive,
    };

    // Handle password update
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Handle file updates
    if (files.passPhoto) {
      updateData.passPhoto = files.passPhoto[0].filename;
    }
    if (files.aadharFront) {
      updateData.aadharFront = files.aadharFront[0].filename;
    }
    if (files.aadharBack) {
      updateData.aadharBack = files.aadharBack[0].filename;
    }
    if (files.pan) {
      updateData.pan = files.pan[0].filename;
    }
    if (files.rationCardFront) {
      updateData.rationCardFront = files.rationCardFront[0].filename;
    }
    if (files.higherEducation) {
      updateData.higherEducation = files.higherEducation[0].filename;
    }
    if (files.resume) {
      updateData.resume = files.resume[0].filename;
    }

    const result = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res
      .status(200)
      .json({
        status: true,
        message: "Employee updated successfully",
        data: result,
      });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`,
    });
  }
};

// Delete Employee
exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findOne({ _id: id });
    if (!employee) {
      return res
        .status(404)
        .json({
          status: false,
          message: "Employee not found",
        });
    }

    await Employee.findByIdAndDelete(id);
    res
      .status(200)
      .json({
        status: true,
        message: "Employee deleted successfully",
      });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`,
    });
  }
};

// List all Employees
exports.list = async (req, res) => {
  try {
    const employees = await Employee.find({}, "name mobileNumber roles passPhoto").sort({
      createdAt: -1,
    });

    if (!employees || employees.length === 0) {
      return res
        .status(404)
        .json({
          status: false,
          message: "No employees found",
        });
    }

    const employeeList = employees.map((emp) => {
      const empObj = emp.toObject();
      if (emp.passPhoto) {
        empObj.passPhoto = baseUrl + emp.passPhoto;
      }
      return empObj;
    });

    res
      .status(200)
      .json({
        status: true,
        message: "Employees list",
        data: employeeList,
      });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`,
    });
  }
};

// Get Employee by ID
exports.findById = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id, "-password -__v");
    if (!employee) {
      return res
        .status(404)
        .json({
          status: false,
          message: "Employee not found",
        });
    }

    const empObj = employee.toObject();
    if (employee.passPhoto) {
      empObj.passPhotos = baseUrl + employee.passPhoto;
    }
    if (employee.aadharFront) {
      empObj.aadharFrontPath = baseUrl + employee.aadharFront;
    }
    if (employee.aadharBack) {
      empObj.aadharBackPath = baseUrl + employee.aadharBack;
    }
    if (employee.pan) {
      empObj.panPath = baseUrl + employee.pan;
    }
    if (employee.rationCardFront) {
      empObj.rationCardFrontPath = baseUrl + employee.rationCardFront;
    }
    if (employee.higherEducation) {
      empObj.higherEducationPath = baseUrl + employee.higherEducation;
    }
    if (employee.resume) {
      empObj.resumePath = baseUrl + employee.resume;
    }

    res
      .status(200)
      .json({
        status: true,
        message: "Employee details",
        data: empObj,
      });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`,
    });
  }
};
