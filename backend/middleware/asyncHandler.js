// Wraps an async endpoint so that any error is passed to Express's error handler
// instead of leaving the request hanging.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);