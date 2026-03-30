/**
 * Standard API response helpers.
 */
const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

const successPaginated = (res, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data, pagination });
};

const error = (res, message, statusCode = 400, errors = undefined) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, successPaginated, error };
