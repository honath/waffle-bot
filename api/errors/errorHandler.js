const Logger = require("../../lib/logger");

/* Get defined log level and instantiate a new logger */
const { LOG_LEVEL } = process.env;

const logger = new Logger(LOG_LEVEL);

function errorHandler(err, req, res, next) {
  const { status = 500, message = "Something went wrong!" } = err;

  try {
    res.status(status).json({ data: message });

    logger.warn({
      action: "Throw an error",
      location: `'errorHandler' in ${__dirname}`,
      status: status,
      notes: [message],
    });
  } catch (error) {
    logger.error({
      action: "Problem responding to requester",
      location: `'errorHandler' in ${__dirname}`,
      status: status,
      notes: [`Response message: ${message}`, error],
    });
  }
}

module.exports = errorHandler;
