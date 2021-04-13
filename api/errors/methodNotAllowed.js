function methodNotAllowed(req, res, next) {
  next({
    status: 405,
    message: `Method ${req.method} for path ${req.originalUrl} not allowed`,
  });
}

module.exports = methodNotAllowed;
