const Logger = require("../../lib/logger");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL, INTERNAL_ACCESS_TOKEN } = process.env;

const logger = new Logger(LOG_LEVEL);

/* Validates the token received on requests to this API */
function verifyInternalToken(request, response, next) {
  logger.trace({
    action: "Validate token for authorization",
    location: `'verifyInternalToken' in ${__dirname}`,
  });

  /* Retrieve authorization header for verification */
  const authHeader = request.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  /* Send an error if no token */
  if (token == null)
    next({
      status: 401,
      message: `No authorization token`,
    });

  /* Verify token matches */
  if (token !== INTERNAL_ACCESS_TOKEN) {
    next({
      status: 403,
      message: "Invalid authorization token",
    });
  }

  logger.info({
    action: "Internal signature verification success",
    location: `${request.method} to ${request.originalUrl}`,
  });

  /* Continue if no issues */
  next();
}

module.exports = verifyInternalToken;
