// For Joi version 17.0.0 and above
const Joi = require('joi').defaults(schema => schema.options({
  errors: {
    wrap: {
      label: false
    }
  }
}));

// Register validation
const registerValidation = (data) => {
    const schema = Joi.object({
        fullName: Joi.string().min(3).required(),
        email: Joi.string().min(6).required().email(),
        rollNumber: Joi.string().required(),
        collegeName: Joi.string().required(),
        contactNo: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
        course: Joi.string().required(),
        semester: Joi.number().integer().min(1).max(12).required(),
        password: Joi.string().min(6).required()
    });
    return schema.validate(data);
};

// Login validation
const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    });
    return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
