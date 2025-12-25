const Joi = require('joi');

exports.signupSchema = Joi.object({
    email: Joi.string().min(6).max(100).required().email({tlds: {allow: ['com', 'net']}}),
    password: Joi.string().required(),
})