// For Joi version 17.0.0 and above
const Joi = require('joi').defaults(schema =>
  schema.options({
    errors: {
      wrap: {
        label: false
      }
    },
    abortEarly: false, // return all errors instead of just the first
    allowUnknown: false // disallow unknown fields
  })
);

// ✅ Register validation schema
const registerValidation = (data) => {
  const schema = Joi.object({
    fullName: Joi.string().min(3).max(100).required().messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 3 characters'
    }),
    email: Joi.string().email().min(6).required().messages({
      'string.email': 'Invalid email format',
      'string.empty': 'Email is required'
    }),
    rollNumber: Joi.string().required().messages({
      'string.empty': 'Roll number is required'
    }),
    collegeName: Joi.string().required().messages({
      'string.empty': 'College name is required'
    }),
    contactNo: Joi.string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Contact number must contain only digits',
        'string.length': 'Contact number must be exactly 10 digits',
        'string.empty': 'Contact number is required'
      }),
    course: Joi.string().required().messages({
      'string.empty': 'Course is required'
    }),
    semester: Joi.number().integer().min(1).max(12).required().messages({
      'number.base': 'Semester must be a number',
      'number.min': 'Semester must be at least 1',
      'number.max': 'Semester must be at most 12'
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    })
  });

  return schema.validate(data);
};

// ✅ Login validation schema
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().min(6).required().messages({
      'string.email': 'Invalid email format',
      'string.empty': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    })
  });

  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation
};
