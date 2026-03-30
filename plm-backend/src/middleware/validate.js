const { ZodError } = require('zod');
const { error } = require('../utils/apiResponse');

/**
 * Zod schema validation middleware factory.
 * @param {Object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
const validate = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) continue;
      try {
        const parsed = schema.parse(req[source]);
        req[source] = parsed; // replace with parsed/coerced values
      } catch (err) {
        if (err instanceof ZodError) {
          err.errors.forEach((e) => {
            errors.push({
              field: e.path.join('.'),
              message: e.message,
              source,
            });
          });
        } else {
          errors.push({ field: 'unknown', message: err.message, source });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

module.exports = validate;
