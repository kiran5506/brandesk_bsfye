const Suggestion = require('../models/suggestionModel');

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString());
  }
  if (!value) {
    return [];
  }
  return value
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildPopulate = (query) =>
  query
    .populate('city_id', 'cityName')
    .populate('service_id', 'serviceName')
    .populate('manual_vendors', 'name mobile_number email')
    .populate('auto_vendors', 'name mobile_number email');

exports.create = async (req, res) => {
  try {
    const { city_id, service_id, manual_vendors, auto_vendors } = req.body;

    if (!city_id || !service_id) {
      return res.status(400).json({
        status: false,
        message: 'City and service are required.'
      });
    }

    const suggestion = new Suggestion({
      city_id,
      service_id,
      manual_vendors: parseList(manual_vendors),
      auto_vendors: parseList(auto_vendors)
    });

    const result = await suggestion.save();
    const populated = await buildPopulate(Suggestion.findById(result._id));

    return res.status(201).json({
      status: true,
      message: 'Suggestion created successfully.',
      data: populated
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

exports.list = async (req, res) => {
  try {
    const suggestions = await buildPopulate(
      Suggestion.find({ isActive: true }).sort({ createdAt: -1 })
    );

    if (!suggestions || suggestions.length === 0) {
      return res.status(200).json({
        status: true,
        message: 'No suggestions found.',
        data: []
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Suggestions list.',
      data: suggestions
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

exports.findById = async (req, res) => {
  try {
    const { id } = req.params;
    const suggestion = await buildPopulate(Suggestion.findById(id));

    if (!suggestion) {
      return res.status(404).json({
        status: false,
        message: 'Suggestion not found.'
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Suggestion details.',
      data: suggestion
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

exports.edit = async (req, res) => {
  try {
    const { id } = req.params;
    const { city_id, service_id, manual_vendors, auto_vendors } = req.body;

    const updateData = {};
    if (city_id) updateData.city_id = city_id;
    if (service_id) updateData.service_id = service_id;
    if (manual_vendors !== undefined) updateData.manual_vendors = parseList(manual_vendors);
    if (auto_vendors !== undefined) updateData.auto_vendors = parseList(auto_vendors);

    const updatedSuggestion = await buildPopulate(
      Suggestion.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    );

    if (!updatedSuggestion) {
      return res.status(404).json({
        status: false,
        message: 'Suggestion not found.'
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Suggestion updated successfully.',
      data: updatedSuggestion
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSuggestion = await Suggestion.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedSuggestion) {
      return res.status(404).json({
        status: false,
        message: 'Suggestion not found.'
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Suggestion deleted successfully.',
      data: deletedSuggestion
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};
